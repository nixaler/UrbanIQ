import { pgTable, uuid, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['client', 'coach', 'admin']);

// Mirrors auth.users.id (Supabase Auth) — not a foreign key across schemas,
// kept as a plain uuid since auth.users lives in a different Postgres schema.
export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  displayName: text('display_name').notNull(),
  email: text('email').notNull(),
  role: userRoleEnum('role').default('client').notNull(),
  businessName: text('business_name'),
  // Only meaningful for role = 'client'. Points at the coach staff member
  // running that client's sessions and helping manage their CRM/social
  // calendar. Nullable until an admin assigns one during onboarding.
  assignedCoachId: uuid('assigned_coach_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
