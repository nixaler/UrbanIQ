import { pgTable, uuid, text, integer, boolean, timestamp, pgEnum, unique } from 'drizzle-orm/pg-core';
import { profiles } from './users';
import { ventSessions } from './sessions';

export const reportReasonEnum = pgEnum('report_reason', [
  'harassment',
  'hate_speech',
  'self_harm_risk',
  'sexual_content',
  'spam',
  'other',
]);
export const reportSeverityEnum = pgEnum('report_severity', ['low', 'medium', 'high', 'critical']);
export const reportStatusEnum = pgEnum('report_status', ['open', 'in_review', 'actioned', 'dismissed']);

export const reports = pgTable('reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').references(() => ventSessions.id, { onDelete: 'cascade' }).notNull(),
  reporterId: uuid('reporter_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  reportedUserId: uuid('reported_user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  reasonCode: reportReasonEnum('reason_code').notNull(),
  note: text('note'),
  // reasonCode='self_harm_risk' auto-escalates to 'critical' at write time —
  // the single highest-priority moderation rule in this pragmatic design.
  severity: reportSeverityEnum('severity').default('medium').notNull(),
  status: reportStatusEnum('status').default('open').notNull(),
  reviewedBy: uuid('reviewed_by'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const blocks = pgTable('blocks', {
  id: uuid('id').defaultRandom().primaryKey(),
  blockerId: uuid('blocker_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  blockedUserId: uuid('blocked_user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uniqPair: unique().on(t.blockerId, t.blockedUserId),
}));

export const sanctionTypeEnum = pgEnum('sanction_type', ['warning', 'temp_suspend', 'permanent_ban']);

export const userSanctions = pgTable('user_sanctions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  type: sanctionTypeEnum('type').notNull(),
  reason: text('reason').notNull(),
  relatedReportId: uuid('related_report_id').references(() => reports.id),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  issuedBy: uuid('issued_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const listenerQuizAttempts = pgTable('listener_quiz_attempts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  score: integer('score').notNull(),
  passed: boolean('passed').notNull(),
  attemptedAt: timestamp('attempted_at', { withTimezone: true }).defaultNow().notNull(),
});
