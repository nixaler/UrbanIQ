import 'server-only';
import Stripe from 'stripe';

// Lazy on purpose, matching the db client pattern — several layouts/pages
// transitively import modules from this directory, and STRIPE_SECRET_KEY
// validation shouldn't run at import time or it breaks Next's build-time
// page-data collection for routes that never touch Stripe.
let cachedStripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (cachedStripe) return cachedStripe;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error('STRIPE_SECRET_KEY is not set');

  cachedStripe = new Stripe(secretKey);
  return cachedStripe;
}
