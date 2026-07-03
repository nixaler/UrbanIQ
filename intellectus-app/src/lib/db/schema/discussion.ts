import { pgTable, uuid, text, integer, real, boolean, timestamp, pgEnum, unique } from 'drizzle-orm/pg-core';
import { users } from './users';
import { articles } from './content';

export const promptSourceEnum = pgEnum('prompt_source', ['ai', 'editor']);

// Dynamic Discussion Prompts (#2).
export const discussionPrompts = pgTable('discussion_prompts', {
  id: uuid('id').defaultRandom().primaryKey(),
  articleId: uuid('article_id').references(() => articles.id, { onDelete: 'cascade' }).notNull(),
  promptText: text('prompt_text').notNull(),
  generatedBy: promptSourceEnum('generated_by').default('ai').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const threadStatusEnum = pgEnum('thread_status', ['open', 'agree_to_disagree_closed']);

// Anonymous Devil's Advocate comments (#5) still carry a real userId for
// moderation traceability — `isAnonymous` only controls display, not storage.
export const comments = pgTable('comments', {
  id: uuid('id').defaultRandom().primaryKey(),
  articleId: uuid('article_id').references(() => articles.id, { onDelete: 'cascade' }).notNull(),
  promptId: uuid('prompt_id').references(() => discussionPrompts.id, { onDelete: 'set null' }),
  parentCommentId: uuid('parent_comment_id'),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  body: text('body').notNull(),
  isAnonymous: boolean('is_anonymous').default(false).notNull(),
  isShadowBanned: boolean('is_shadow_banned').default(false).notNull(),
  threadStatus: threadStatusEnum('thread_status').default('open').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Agree-to-Disagree closures (#7) require mutual consent from both
// participants in a sub-thread before the thread locks.
export const threadCloseRequests = pgTable('thread_close_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  commentId: uuid('comment_id').references(() => comments.id, { onDelete: 'cascade' }).notNull(),
  requestedBy: uuid('requested_by').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  confirmedBy: uuid('confirmed_by').references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Two-dimensional voting (#3): "Well Researched" vs "I Agree" are tracked as
// separate vote_type rows so they never cross-contaminate the same tally.
export const voteTypeEnum = pgEnum('vote_type', ['well_researched', 'agree']);

export const commentVotes = pgTable('comment_votes', {
  id: uuid('id').defaultRandom().primaryKey(),
  commentId: uuid('comment_id').references(() => comments.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  voteType: voteTypeEnum('vote_type').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uniqVotePerUserPerDimension: unique().on(t.commentId, t.userId, t.voteType),
}));

// Frictionless Micro-Forms (#20) — inline polls positioned inside a content block's body.
export const microPollResponses = pgTable('micro_poll_responses', {
  id: uuid('id').defaultRandom().primaryKey(),
  articleId: uuid('article_id').references(() => articles.id, { onDelete: 'cascade' }).notNull(),
  blockId: uuid('block_id'),
  positionMarker: text('position_marker').notNull(),
  choice: text('choice').notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uniqResponsePerUserPerMarker: unique().on(t.articleId, t.positionMarker, t.userId),
}));

export const moderationTargetEnum = pgEnum('moderation_target', ['comment', 'user', 'huddle']);
export const moderationActionEnum = pgEnum('moderation_action', ['none', 'shadow_ban', 'remove', 'warn']);

// Shared by two-dimensional voting, badges, Devil's Advocate, and
// shadow-banning — see reputationEngine.ts.
export const moderationFlags = pgTable('moderation_flags', {
  id: uuid('id').defaultRandom().primaryKey(),
  targetType: moderationTargetEnum('target_type').notNull(),
  targetId: uuid('target_id').notNull(),
  reason: text('reason').notNull(),
  flaggedBy: uuid('flagged_by').references(() => users.id, { onDelete: 'set null' }),
  status: text('status').default('open').notNull(), // open | reviewed | dismissed
  actionTaken: moderationActionEnum('action_taken').default('none').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Live Audio Huddles (#6) — schema scaffolded now, LiveKit wiring deferred
// past initial launch per the confirmed product decision.
export const huddleStatusEnum = pgEnum('huddle_status', ['scheduled', 'live', 'ended']);
export const huddleRoleEnum = pgEnum('huddle_role', ['host', 'speaker', 'listener']);

export const huddles = pgTable('huddles', {
  id: uuid('id').defaultRandom().primaryKey(),
  articleId: uuid('article_id').references(() => articles.id, { onDelete: 'cascade' }).notNull(),
  hostUserId: uuid('host_user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  livekitRoomName: text('livekit_room_name'),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  status: huddleStatusEnum('status').default('scheduled').notNull(),
  durationMinutes: integer('duration_minutes').default(15).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const huddleParticipants = pgTable('huddle_participants', {
  id: uuid('id').defaultRandom().primaryKey(),
  huddleId: uuid('huddle_id').references(() => huddles.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  role: huddleRoleEnum('role').default('listener').notNull(),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
});

// Read-to-Unlock gate (#1): comments stay locked until scroll% and time-spent
// both clear their thresholds. Server-verified, not just a client flag.
export const readingProgress = pgTable('reading_progress', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  articleId: uuid('article_id').references(() => articles.id, { onDelete: 'cascade' }).notNull(),
  scrollPct: real('scroll_pct').default(0).notNull(),
  timeSpentSeconds: integer('time_spent_seconds').default(0).notNull(),
  unlockedComments: boolean('unlocked_comments').default(false).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uniqProgressPerUserPerArticle: unique().on(t.userId, t.articleId),
}));
