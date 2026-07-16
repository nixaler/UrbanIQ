import { pgTable, uuid, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';

export const socialPlatformEnum = pgEnum('social_platform', [
  'instagram',
  'tiktok',
  'facebook',
  'linkedin',
  'x',
  'youtube',
  'other',
]);

export const postStatusEnum = pgEnum('post_status', ['draft', 'scheduled', 'posted']);

export const socialAccounts = pgTable('social_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  platform: socialPlatformEnum('platform').notNull(),
  handle: text('handle').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// V1 is a real, shared content calendar (client + assigned coach/manager
// both read and write) — not live auto-posting to platform APIs. Marking
// something "posted" here just tracks that it went out, it doesn't publish
// it. See NIXALER_PLAN.md Phase 7 for real per-platform API integration.
export const contentPosts = pgTable('content_posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  platform: socialPlatformEnum('platform').notNull(),
  caption: text('caption').notNull(),
  mediaUrl: text('media_url'),
  status: postStatusEnum('status').default('draft').notNull(),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  createdBy: uuid('created_by').references(() => users.id).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
