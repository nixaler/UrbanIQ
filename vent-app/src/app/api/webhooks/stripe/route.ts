import { NextResponse } from 'next/server';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { donations, aggregateIssueStats } from '@/lib/db/schema';
import { getStripe } from '@/lib/stripe/client';
import type Stripe from 'stripe';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const signature = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const body = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const checkoutSession = event.data.object as Stripe.Checkout.Session;

    const [donation] = await db
      .update(donations)
      .set({
        status: 'succeeded',
        stripePaymentIntentId: (checkoutSession.payment_intent as string) ?? checkoutSession.id,
      })
      .where(eq(donations.stripePaymentIntentId, checkoutSession.id))
      .returning();

    if (donation?.issueId) {
      await db
        .insert(aggregateIssueStats)
        .values({ issueId: donation.issueId, totalDonatedCents: donation.amountCents })
        .onConflictDoUpdate({
          target: aggregateIssueStats.issueId,
          set: {
            totalDonatedCents: sql`${aggregateIssueStats.totalDonatedCents} + ${donation.amountCents}`,
            lastComputedAt: new Date(),
          },
        });
    }
  }

  return NextResponse.json({ received: true });
}
