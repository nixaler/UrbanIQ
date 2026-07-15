import { pgTable, uuid, text, integer, boolean, timestamp, pgEnum, unique } from 'drizzle-orm/pg-core';
import { profiles } from './users';
import { topics } from './topics';
import { ventSessions } from './sessions';

// Public/systemic follow targets — e.g. "layoffs at tech companies" under the
// Career Burnout topic. Individual vents can be linked to one via
// createdFromSessionId so Phase 4 rollups have something to aggregate.
export const issues = pgTable('issues', {
  id: uuid('id').defaultRandom().primaryKey(),
  topicId: uuid('topic_id').references(() => topics.id).notNull(),
  label: text('label'),
  createdFromSessionId: uuid('created_from_session_id').references(() => ventSessions.id),
  isFeatured: boolean('is_featured').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const issueFollows = pgTable('issue_follows', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  issueId: uuid('issue_id').references(() => issues.id, { onDelete: 'cascade' }).notNull(),
  followedAt: timestamp('followed_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uniqPair: unique().on(t.userId, t.issueId),
}));

export const charityVettingStatusEnum = pgEnum('charity_vetting_status', ['pending', 'approved', 'rejected']);

export const charities = pgTable('charities', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  topicId: uuid('topic_id').references(() => topics.id),
  description: text('description').notNull(),
  website: text('website').notNull(),
  vettingStatus: charityVettingStatusEnum('vetting_status').default('pending').notNull(),
  stripeConnectedAccountId: text('stripe_connected_account_id'),
});

export const donationStatusEnum = pgEnum('donation_status', ['pending', 'succeeded', 'failed', 'refunded']);

export const donations = pgTable('donations', {
  id: uuid('id').defaultRandom().primaryKey(),
  // Anonymous donations allowed — donorId is nullable.
  donorId: uuid('donor_id').references(() => profiles.id),
  charityId: uuid('charity_id').references(() => charities.id).notNull(),
  // Exactly one of sessionId (micro-donation tied to a specific vent) or
  // issueId (macro/aggregate campaign donation) is expected to be set.
  sessionId: uuid('session_id').references(() => ventSessions.id),
  issueId: uuid('issue_id').references(() => issues.id),
  amountCents: integer('amount_cents').notNull(),
  currency: text('currency').default('usd').notNull(),
  stripePaymentIntentId: text('stripe_payment_intent_id').unique().notNull(),
  status: donationStatusEnum('status').default('pending').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Rollup table, recomputed periodically rather than aggregated live on every
// page load — powers the (Phase 4) macro awareness dashboard.
export const aggregateIssueStats = pgTable('aggregate_issue_stats', {
  issueId: uuid('issue_id').references(() => issues.id, { onDelete: 'cascade' }).primaryKey(),
  totalFollowers: integer('total_followers').default(0).notNull(),
  totalVentsCount: integer('total_vents_count').default(0).notNull(),
  totalDonatedCents: integer('total_donated_cents').default(0).notNull(),
  lastComputedAt: timestamp('last_computed_at', { withTimezone: true }).defaultNow().notNull(),
});
