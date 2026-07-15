import { NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { charities, donations } from '@/lib/db/schema';
import { getCurrentProfile } from '@/lib/auth/currentUser';
import { getStripe } from '@/lib/stripe/client';
import { featureFlags } from '@/lib/config/featureFlags';

export const runtime = 'nodejs';

const bodySchema = z
  .object({
    charityId: z.string().uuid(),
    amountCents: z.number().int().min(100).max(100_000),
    sessionId: z.string().uuid().optional(),
    issueId: z.string().uuid().optional(),
  })
  .refine((data) => !!data.sessionId !== !!data.issueId, {
    message: 'Exactly one of sessionId or issueId is required',
  });

// Donations are anonymous-friendly: donorId is only set if the caller has a
// (possibly anonymous) session, but the checkout itself doesn't require
// upgrading past anonymous auth.
export async function POST(request: Request) {
  if (!featureFlags.donationsEnabled) {
    return NextResponse.json({ error: 'Donations are not enabled yet' }, { status: 404 });
  }

  const profile = await getCurrentProfile();
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const [charity] = await db.select().from(charities).where(eq(charities.id, parsed.data.charityId)).limit(1);
  if (!charity || charity.vettingStatus !== 'approved') {
    return NextResponse.json({ error: 'Charity not available' }, { status: 404 });
  }

  const stripe = getStripe();
  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: `Donation to ${charity.name}` },
          unit_amount: parsed.data.amountCents,
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/donations/thanks`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/topics`,
  });

  // stripePaymentIntentId is repurposed to hold the Checkout Session id until
  // the webhook fires and swaps in the real PaymentIntent id — see
  // webhooks/stripe/route.ts.
  await db.insert(donations).values({
    donorId: profile?.id ?? null,
    charityId: charity.id,
    sessionId: parsed.data.sessionId,
    issueId: parsed.data.issueId,
    amountCents: parsed.data.amountCents,
    stripePaymentIntentId: checkoutSession.id,
    status: 'pending',
  });

  return NextResponse.json({ checkoutUrl: checkoutSession.url });
}
