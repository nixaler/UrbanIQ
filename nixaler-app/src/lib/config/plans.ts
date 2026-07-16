// Single fixed-price plan for V1, per the confirmed product decision in
// NIXALER_PLAN.md. Dollar figure is a placeholder — a real business decision,
// not something to treat as committed. Change here and in Stripe together.
export const PLAN = {
  id: 'nixaler-launch-monthly',
  name: 'niXaler Launch',
  priceMonthly: 497,
  priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID ?? '',
  features: [
    'LLC formation, filed on your behalf',
    'Tax-advantage guidance for your new entity',
    'A real website, built and hosted for you',
    'A CRM to run your own customer relationships',
    'A social media manager and shared content calendar',
    '1:1 coaching plus a self-serve founder curriculum',
  ],
} as const;
