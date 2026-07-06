/**
 * Centralized feature flags for capabilities that are fully wired but
 * deliberately shipped disabled — see INTELLECTUS_PLAN.md's risk notes.
 * Default to `false` in every case; flip via env var once the underlying
 * business/legal precondition is actually satisfied.
 */
export const PAYWALL_ENABLED = process.env.NEXT_PUBLIC_PAYWALL_ENABLED === 'true';
export const TIPPING_ENABLED = process.env.NEXT_PUBLIC_TIPPING_ENABLED === 'true';
export const STAKING_REAL_MONEY_ENABLED = process.env.NEXT_PUBLIC_STAKING_REAL_MONEY_ENABLED === 'true';
