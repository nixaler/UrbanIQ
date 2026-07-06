import { pgTable, uuid, text, integer, bigint, boolean, timestamp, pgEnum, unique } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['reader', 'contributor', 'moderator', 'editor', 'admin']);
export const privacyModeEnum = pgEnum('privacy_mode', ['standard', 'zero_data']);

// Mirrors auth.users.id (Supabase Auth) — not a foreign key across schemas,
// kept as a plain uuid since auth.users lives in a different Postgres schema.
export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  displayName: text('display_name').notNull(),
  // False for the auto-generated email-prefix name the signup trigger sets;
  // flips to true once the user picks their own via updateDisplayName().
  // Drives whether the lightweight name-prompt banner shows.
  displayNameSet: boolean('display_name_set').default(false).notNull(),
  avatarUrl: text('avatar_url'),
  role: userRoleEnum('role').default('reader').notNull(),
  reputationScore: integer('reputation_score').default(0).notNull(),
  isShadowBanned: boolean('is_shadow_banned').default(false).notNull(),
  privacyMode: privacyModeEnum('privacy_mode').default('standard').notNull(),
  knowledgePoints: bigint('knowledge_points', { mode: 'number' }).default(0).notNull(),
  currentStreak: integer('current_streak').default(0).notNull(),
  streakShields: integer('streak_shields').default(0).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Single ledger feeding two-dimensional voting, badges, Devil's Advocate
// eligibility, and shadow-banning. One source of truth, four consumers.
export const reputationEventTypeEnum = pgEnum('reputation_event_type', [
  'vote_well_researched_received',
  'vote_agree_received',
  'comment_flagged',
  'comment_removed',
  'civility_bonus',
  'manual_adjustment',
]);

export const reputationEvents = pgTable('reputation_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  delta: integer('delta').notNull(),
  reason: reputationEventTypeEnum('reason').notNull(),
  relatedCommentId: uuid('related_comment_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const badges = pgTable('badges', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').unique().notNull(),
  label: text('label').notNull(),
  description: text('description').notNull(),
  minReputationScore: integer('min_reputation_score').default(0).notNull(),
});

export const userBadges = pgTable('user_badges', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  badgeId: uuid('badge_id').references(() => badges.id, { onDelete: 'cascade' }).notNull(),
  topicId: uuid('topic_id'),
  awardedAt: timestamp('awarded_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uniqUserBadgeTopic: unique().on(t.userId, t.badgeId, t.topicId),
}));

export const privacySettings = pgTable('privacy_settings', {
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).primaryKey(),
  zeroDataMode: boolean('zero_data_mode').default(false).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
