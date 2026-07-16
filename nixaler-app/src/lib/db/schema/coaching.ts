import { pgTable, uuid, text, integer, timestamp, pgEnum, unique } from 'drizzle-orm/pg-core';
import { users } from './users';

export const sessionStatusEnum = pgEnum('session_status', [
  'requested',
  'scheduled',
  'completed',
  'canceled',
]);

export const curriculumModules = pgTable('curriculum_modules', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  order: integer('order').notNull(),
  resourceUrl: text('resource_url'),
});

export const moduleProgress = pgTable('module_progress', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  moduleId: uuid('module_id').references(() => curriculumModules.id, { onDelete: 'cascade' }).notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  uniqUserModule: unique().on(t.userId, t.moduleId),
}));

export const coachingSessions = pgTable('coaching_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  clientId: uuid('client_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  coachId: uuid('coach_id').references(() => users.id),
  status: sessionStatusEnum('status').default('requested').notNull(),
  requestedAt: timestamp('requested_at', { withTimezone: true }).defaultNow().notNull(),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
  notes: text('notes'),
});
