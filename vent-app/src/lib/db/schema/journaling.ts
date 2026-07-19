import { pgTable, uuid, integer, timestamp } from 'drizzle-orm/pg-core';
import { profiles } from './users';
import { ventSessions } from './sessions';
import { ventBottles } from './bottles';

// Venter-only (listeners aren't asked to quantify someone else's feelings).
// Private to the user — never shared, never aggregated into anyone else's view.
export const moodCheckins = pgTable('mood_checkins', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => profiles.id, { onDelete: 'cascade' }).notNull(),
  sessionId: uuid('session_id').references(() => ventSessions.id),
  bottleId: uuid('bottle_id').references(() => ventBottles.id),
  moodBefore: integer('mood_before'),
  moodAfter: integer('mood_after').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
