'use server';

import { redirect } from 'next/navigation';
import { getStripe } from '@/lib/stripe/client';
import { PLAN } from '@/lib/config/plans';
import { requireUser } from '@/lib/auth/guards';

export async function startCheckoutAction() {
  const user = await requireUser();
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: PLAN.priceId, quantity: 1 }],
    customer_email: user.email,
    client_reference_id: user.id,
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/dashboard?checkout=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/pricing?checkout=canceled`,
  });

  if (session.url) redirect(session.url);
}
