import { pgTable, uuid, text, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { profiles } from './users';
import { topics } from './topics';

export const bottleStatusEnum = pgEnum('bottle_status', ['pending', 'claimed', 'replied', 'expired']);

// "Message in a Bottle" — async fallback for when no live listener is
// available. Solves the 3am cold-start problem without a dead-end
// "no one's available" screen.
export const ventBottles = pgTable('vent_bottles', {
  id: uuid('id').defaultRandom().primaryKey(),
  venterId: uuid('venter_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  topicId: uuid('topic_id').references(() => topics.id).notNull(),
  audioUrl: text('audio_url').notNull(),
  durationSeconds: integer('duration_seconds').notNull(),
  status: bottleStatusEnum('status').default('pending').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});

export const bottleReplies = pgTable('bottle_replies', {
  id: uuid('id').defaultRandom().primaryKey(),
  bottleId: uuid('bottle_id').references(() => ventBottles.id, { onDelete: 'cascade' }).notNull().unique(),
  listenerId: uuid('listener_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  audioUrl: text('audio_url').notNull(),
  durationSeconds: integer('duration_seconds').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
