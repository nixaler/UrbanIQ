import { pgTable, uuid, text, integer, timestamp, pgEnum, unique } from 'drizzle-orm/pg-core';
import { profiles } from './users';
import { ventSessions } from './sessions';

export const empathyRatings = pgTable('empathy_ratings', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').references(() => ventSessions.id, { onDelete: 'cascade' }).notNull().unique(),
  raterId: uuid('rater_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  ratedUserId: uuid('rated_user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  stars: integer('stars').notNull(),
  tags: text('tags').array(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const karmaReasonEnum = pgEnum('karma_reason', [
  'listened_full_vent',
  'extend_call_completed',
  'high_empathy_rating',
  'bottle_reply_sent',
  'streak_bonus',
  'sanction_penalty',
]);

// Append-only ledger — the source of truth for karma. profiles.totalKarma and
// garden_state are both denormalized caches rebuilt from this.
export const karmaLedger = pgTable('karma_ledger', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  sessionId: uuid('session_id').references(() => ventSessions.id),
  points: integer('points').notNull(),
  reasonCode: karmaReasonEnum('reason_code').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const badges = pgTable('badges', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').unique().notNull(),
  name: text('name').notNull(),
  description: text('description').notNull(),
  iconUrl: text('icon_url'),
});

export const userBadges = pgTable('user_badges', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  badgeId: uuid('badge_id').references(() => badges.id, { onDelete: 'cascade' }).notNull(),
  earnedAt: timestamp('earned_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uniqPair: unique().on(t.userId, t.badgeId),
}));

// Derived/cached, one row per user — kept separate from karma_ledger so the
// garden visual can render instantly rather than being summed on every load.
// No leaderboards: this is comparative only to the user's own past.
export const gardenState = pgTable('garden_state', {
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).primaryKey(),
  droplets: integer('droplets').default(0).notNull(),
  bloomStage: integer('bloom_stage').default(0).notNull(),
  currentStreakDays: integer('current_streak_days').default(0).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
