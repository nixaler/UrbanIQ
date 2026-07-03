'use server';

import { db } from '@/lib/db/client';
import { subscriptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireUser } from '@/lib/auth/guards';
import { getStripeClient } from '@/lib/stripe/client';

/**
 * Premium Ad-Free Discussion Rooms (#22). Reading stays free — this only
 * gates the discussion/expert-commentary surface, per the confirmed
 * "free at launch" decision. Checkout starts a Stripe flow; the webhook
 * (api/webhooks/stripe/route.ts) is the ONLY writer of subscription status —
 * this action never flips status itself, since trusting a client-visible
 * redirect to mean "payment succeeded" is exactly the kind of gap Stripe's
 * webhook signature exists to close.
 */
export async function createCheckoutSession(params: { priceId: string; successUrl: string; cancelUrl: string }) {
  const user = await requireUser();
  const stripe = getStripeClient();

  const [existing] = await db.select().from(subscriptions).where(eq(subscriptions.userId, user.id)).limit(1);

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: existing?.stripeCustomerId,
    line_items: [{ price: params.priceId, quantity: 1 }],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    client_reference_id: user.id,
  });

  return { url: session.url };
}
