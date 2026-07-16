import { pgTable, uuid, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';

export const llcStatusEnum = pgEnum('llc_status', [
  'not_started',
  'info_submitted',
  'filed',
  'ein_issued',
  'complete',
]);

// One row per client business. Status is advanced by an admin/ops user as
// the filing actually happens — there is no live Secretary-of-State API
// integration in V1 (see NIXALER_PLAN.md Phase 7), so this table is the
// single source of truth for "where is my LLC" the client-facing stepper
// reads from.
export const llcFormations = pgTable('llc_formations', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  businessName: text('business_name').notNull(),
  formationState: text('formation_state'),
  entityType: text('entity_type').default('LLC').notNull(),
  status: llcStatusEnum('status').default('not_started').notNull(),
  ein: text('ein'),
  filedAt: timestamp('filed_at', { withTimezone: true }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const onboardingDocuments = pgTable('onboarding_documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  formationId: uuid('formation_id').references(() => llcFormations.id, { onDelete: 'cascade' }).notNull(),
  label: text('label').notNull(),
  fileUrl: text('file_url').notNull(),
  uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow().notNull(),
});
