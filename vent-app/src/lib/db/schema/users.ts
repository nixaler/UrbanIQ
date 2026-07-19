import { pgTable, uuid, text, integer, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const profileStatusEnum = pgEnum('profile_status', ['active', 'suspended', 'banned']);
export const preferredRoleEnum = pgEnum('preferred_role', ['venter', 'listener', 'either']);

// Mirrors auth.users.id (Supabase Auth) — not a foreign key across schemas,
// kept as a plain uuid since auth.users lives in a different Postgres schema.
// Created by Supabase anonymous auth by default; email is only ever set if
// the user opts in to upgrading their anonymous identity.
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  pseudonym: text('pseudonym').notNull(),
  isAnonymous: boolean('is_anonymous').default(true).notNull(),
  email: text('email'),
  tosAcceptedAt: timestamp('tos_accepted_at', { withTimezone: true }),
  tosVersion: text('tos_version'),
  status: profileStatusEnum('status').default('active').notNull(),
  totalKarma: integer('total_karma').default(0).notNull(),
  preferredRoleDefault: preferredRoleEnum('preferred_role_default').default('either').notNull(),
  // Optional, self-selected background tags (see src/lib/config/identityTags.ts).
  // A soft preference signal for matching only — never a hard filter, and
  // never required, so skipping it can't be used to fingerprint a user.
  identityTags: text('identity_tags').array(),
  // Set once profiles.status allows listening AND the user has passed the
  // Listener Academy quiz (see listenerQuizAttempts). Required before a
  // user's first role='listener' queue entry.
  listenerCertifiedAt: timestamp('listener_certified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  lastActiveAt: timestamp('last_active_at', { withTimezone: true }).defaultNow().notNull(),
});
