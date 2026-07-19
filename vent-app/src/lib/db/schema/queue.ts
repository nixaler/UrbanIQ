import { pgTable, uuid, timestamp, pgEnum, index } from 'drizzle-orm/pg-core';
import { profiles } from './users';
import { topics } from './topics';
import { ventSessions } from './sessions';

export const queueRoleEnum = pgEnum('queue_role', ['venter', 'listener']);
export const queueStatusEnum = pgEnum('queue_status', ['waiting', 'matched', 'cancelled', 'expired']);

export const queueEntries = pgTable('queue_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  role: queueRoleEnum('role').notNull(),
  // Null means "any topic" — only valid for role='listener'; a venter always
  // picks a specific topic before enqueuing.
  topicId: uuid('topic_id').references(() => topics.id),
  status: queueStatusEnum('status').default('waiting').notNull(),
  sessionId: uuid('session_id').references(() => ventSessions.id),
  enqueuedAt: timestamp('enqueued_at', { withTimezone: true }).defaultNow().notNull(),
  matchedAt: timestamp('matched_at', { withTimezone: true }),
}, (t) => ({
  matcherScanIdx: index('queue_entries_matcher_scan_idx').on(t.role, t.topicId, t.status, t.enqueuedAt),
}));
