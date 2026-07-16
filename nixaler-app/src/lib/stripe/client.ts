import Stripe from 'stripe';

// Lazy singleton, same reasoning as src/lib/db/client.ts — pages that never
// touch Stripe shouldn't crash at build/import time over a missing key.
let cached: Stripe | null = null;

export function getStripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
  cached = new Stripe(key, { apiVersion: '2025-02-24.acacia' });
  return cached;
}
