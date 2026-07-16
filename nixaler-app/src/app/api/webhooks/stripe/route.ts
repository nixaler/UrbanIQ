import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { subscriptions } from '@/lib/db/schema';
import { getStripe } from '@/lib/stripe/client';
import { PLAN } from '@/lib/config/plans';
import type Stripe from 'stripe';

// The sole writer of subscriptions.status — dashboard access gating reads
// only this table, never client-supplied state, since a redirect to
// success_url proves nothing without this signature-verified event
// confirming payment actually completed.
export async function POST(request: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json(
      { error: `Invalid signature: ${err instanceof Error ? err.message : err}` },
      { status: 400 },
    );
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      if (userId && typeof session.customer === 'string') {
        await db
          .insert(subscriptions)
          .values({
            userId,
            stripeCustomerId: session.customer,
            stripeSubscriptionId: typeof session.subscription === 'string' ? session.subscription : undefined,
            planId: PLAN.id,
            status: 'active',
          })
          .onConflictDoNothing();
      }
      break;
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const status = sub.status === 'active' ? 'active' : sub.status === 'past_due' ? 'past_due' : 'canceled';
      await db
        .update(subscriptions)
        .set({ status, updatedAt: new Date() })
        .where(eq(subscriptions.stripeSubscriptionId, sub.id));
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
