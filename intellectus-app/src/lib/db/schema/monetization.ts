import { pgTable, uuid, text, integer, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';

// Sponsored Expert Co-Authorship (#21). Speculative feature — schema exists,
// no active sponsor pipeline yet.
export const sponsors = pgTable('sponsors', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyName: text('company_name').notNull(),
  contactEmail: text('contact_email').notNull(),
  disclosureCopy: text('disclosure_copy').notNull(),
  active: boolean('active').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const subscriptionTierEnum = pgEnum('subscription_tier', [
  'free',
  'premium_discussion',
  'weekend_vault',
]);
export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'past_due',
  'canceled',
  'incomplete',
]);

// Stripe webhooks are the sole writer of `status`/`tier` — never trust
// client-side state for paywall gating (Premium Discussion Rooms, #22).
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  stripeCustomerId: text('stripe_customer_id').notNull(),
  stripeSubscriptionId: text('stripe_subscription_id'),
  tier: subscriptionTierEnum('tier').default('free').notNull(),
  status: subscriptionStatusEnum('status').default('incomplete').notNull(),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const tipStatusEnum = pgEnum('tip_status', ['pending', 'succeeded', 'failed', 'refunded']);

// Micro-Tipping (#23) — real money via Stripe Connect per the confirmed
// product decision. Kept behind a feature flag pending KYC/payout setup.
export const tips = pgTable('tips', {
  id: uuid('id').defaultRandom().primaryKey(),
  fromUserId: uuid('from_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  toUserId: uuid('to_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  commentId: uuid('comment_id'),
  amountCents: integer('amount_cents').notNull(),
  stripePaymentIntentId: text('stripe_payment_intent_id').notNull(),
  status: tipStatusEnum('status').default('pending').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
