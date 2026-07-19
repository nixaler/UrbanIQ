import { pgTable, uuid, text, integer, boolean, timestamp, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { profiles } from './users';
import { topics } from './topics';

export const sessionStatusEnum = pgEnum('session_status', [
  'queued',
  'matched',
  'venting',
  'awaiting_decision',
  'extend_requested',
  'extended',
  'completed',
  'abandoned',
  'ended_by_report',
]);
export const cameraModeEnum = pgEnum('camera_mode', ['off', 'on', 'avatar_mask']);
export const decisionEnum = pgEnum('decision', ['send_support', 'extend_call', 'follow_issue', 'none']);
export const endReasonEnum = pgEnum('end_reason', ['completed', 'venter_left', 'listener_left', 'timeout', 'reported']);

export const ventSessions = pgTable('vent_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  topicId: uuid('topic_id').references(() => topics.id).notNull(),
  venterId: uuid('venter_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  listenerId: uuid('listener_id').references(() => profiles.id, { onDelete: 'cascade' }),
  status: sessionStatusEnum('status').default('queued').notNull(),
  cameraMode: cameraModeEnum('camera_mode').default('off').notNull(),
  // Server-authoritative — set once by POST /api/session/[id]/vent-start.
  // Never derive the 60s countdown from a client clock.
  ventStartedAt: timestamp('vent_started_at', { withTimezone: true }),
  ventDurationSeconds: integer('vent_duration_seconds').default(60).notNull(),
  decision: decisionEnum('decision').default('none'),
  extendRequestedBy: uuid('extend_requested_by').references(() => profiles.id),
  extendRespondedAt: timestamp('extend_responded_at', { withTimezone: true }),
  extendAccepted: boolean('extend_accepted'),
  callEndedAt: timestamp('call_ended_at', { withTimezone: true }),
  endReason: endReasonEnum('end_reason'),
  dailyRoomName: text('daily_room_name'),
  dailyRoomUrl: text('daily_room_url'),
  dailyRoomExpiresAt: timestamp('daily_room_expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Raw Daily webhook audit log (participant-left, recording-ready, etc).
// Recording is off by default given content sensitivity — enabling it is a
// separate, explicit future decision.
export const dailyRoomEvents = pgTable('daily_room_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').references(() => ventSessions.id, { onDelete: 'cascade' }).notNull(),
  eventType: text('event_type').notNull(),
  payload: jsonb('payload').notNull(),
  receivedAt: timestamp('received_at', { withTimezone: true }).defaultNow().notNull(),
});
