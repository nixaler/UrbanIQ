'use server';

import { db } from '@/lib/db/client';
import { tips, comments } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireUser } from '@/lib/auth/guards';
import { getStripeClient } from '@/lib/stripe/client';
import { TIPPING_ENABLED } from '@/lib/config/featureFlags';

/**
 * Micro-Tipping (#23) — real money via Stripe Connect per the confirmed
 * decision, but gated off by default (TIPPING_ENABLED) pending Stripe
 * Connect KYC/payout setup for recipients. This creates the PaymentIntent
 * and records the tip as `pending`; the webhook flips it to `succeeded`.
 * NOTE: routing the payout to the recipient (`transfer_data.destination`)
 * requires each user to have onboarded a Stripe Connect account first —
 * that onboarding flow is out of scope here and must exist before this can
 * go live; until then, flip TIPPING_ENABLED only in a controlled test.
 */
export async function createTip(params: { commentId: string; amountCents: number }) {
  if (!TIPPING_ENABLED) throw new Error('Tipping is not enabled yet');

  const user = await requireUser();
  const { commentId, amountCents } = params;
  if (amountCents < 50) throw new Error('Minimum tip is $0.50');

  const [comment] = await db.select({ userId: comments.userId }).from(comments).where(eq(comments.id, commentId)).limit(1);
  if (!comment) throw new Error('Comment not found');
  if (comment.userId === user.id) throw new Error('Cannot tip your own comment');

  const stripe = getStripeClient();
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: 'usd',
    metadata: { commentId, fromUserId: user.id, toUserId: comment.userId },
  });

  await db.insert(tips).values({
    fromUserId: user.id,
    toUserId: comment.userId,
    commentId,
    amountCents,
    stripePaymentIntentId: paymentIntent.id,
    status: 'pending',
  });

  return { clientSecret: paymentIntent.client_secret };
}
