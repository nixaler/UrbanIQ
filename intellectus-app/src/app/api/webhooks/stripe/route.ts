import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { subscriptions, tips } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getStripeClient } from '@/lib/stripe/client';
import type Stripe from 'stripe';

// The sole writer of subscriptions.status/tier — Premium Discussion Rooms
// (#22) gating reads only this table, never a client-supplied flag, because
// a client redirect to `success_url` proves nothing without this
// signature-verified event confirming payment actually completed.
export async function POST(request: Request) {
  const stripe = getStripeClient();
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
    return NextResponse.json({ error: `Invalid signature: ${err instanceof Error ? err.message : err}` }, { status: 400 });
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
            tier: 'premium_discussion',
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
        .set({ status, currentPeriodEnd: new Date(sub.current_period_end * 1000) })
        .where(eq(subscriptions.stripeSubscriptionId, sub.id));
      break;
    }
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await db
        .update(tips)
        .set({ status: 'succeeded' })
        .where(eq(tips.stripePaymentIntentId, paymentIntent.id));
      break;
    }
    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      await db
        .update(tips)
        .set({ status: 'failed' })
        .where(eq(tips.stripePaymentIntentId, paymentIntent.id));
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
