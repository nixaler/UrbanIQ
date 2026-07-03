import { pgTable, uuid, text, integer, real, date, boolean, timestamp, pgEnum, unique } from 'drizzle-orm/pg-core';
import { users } from './users';

// Communal Streaks / Reading Guilds (#13) — if any member misses their daily
// read, the whole guild's multiplier drops, not just that member's.
export const guilds = pgTable('guilds', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const guildMembers = pgTable('guild_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  guildId: uuid('guild_id').references(() => guilds.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uniqMemberPerGuild: unique().on(t.guildId, t.userId),
}));

export const guildStreaks = pgTable('guild_streaks', {
  guildId: uuid('guild_id').references(() => guilds.id, { onDelete: 'cascade' }).primaryKey(),
  currentStreak: integer('current_streak').default(0).notNull(),
  multiplier: real('multiplier').default(1).notNull(),
  lastResetDate: date('last_reset_date'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Predictive Staking (#14) — real money eventually per the confirmed
// decision; kept behind a feature flag pending regulatory review.
export const predictionStatusEnum = pgEnum('prediction_status', ['open', 'resolved_yes', 'resolved_no', 'voided']);

export const predictions = pgTable('predictions', {
  id: uuid('id').defaultRandom().primaryKey(),
  articleId: uuid('article_id'),
  question: text('question').notNull(),
  closesAt: timestamp('closes_at', { withTimezone: true }).notNull(),
  status: predictionStatusEnum('status').default('open').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const predictionStakes = pgTable('prediction_stakes', {
  id: uuid('id').defaultRandom().primaryKey(),
  predictionId: uuid('prediction_id').references(() => predictions.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  side: boolean('side').notNull(), // true = yes, false = no
  amount: integer('amount').notNull(), // Knowledge Points at stake time
  settled: boolean('settled').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
