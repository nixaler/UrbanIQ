import { pgTable, uuid, text, time, boolean, jsonb, timestamp } from 'drizzle-orm/pg-core';
import { users } from './users';

// Custom Notification Sequencing (#16) — per-user "Intel Window" time,
// dispatched via Inngest step.sleepUntil rather than a single global cron.
export const notificationPrefs = pgTable('notification_prefs', {
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).primaryKey(),
  intelWindowTime: time('intel_window_time').default('07:45:00').notNull(),
  timezone: text('timezone').default('UTC').notNull(),
  channels: jsonb('channels').$type<{ push: boolean; email: boolean }>().default({ push: true, email: false }).notNull(),
});

export const notificationsLog = pgTable('notifications_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  channel: text('channel').notNull(),
  payload: jsonb('payload'),
  sentAt: timestamp('sent_at', { withTimezone: true }).defaultNow().notNull(),
});

// Algorithmic Reset Toggle / "Pop My Bubble" (#25).
export const feedResetEvents = pgTable('feed_reset_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  activatedAt: timestamp('activated_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});
