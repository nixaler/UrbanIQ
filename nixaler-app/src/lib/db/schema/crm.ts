import { pgTable, uuid, text, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';

export const crmStageEnum = pgEnum('crm_stage', ['lead', 'qualified', 'customer', 'churned']);

// A row here is one of the *client's own* end customers — this is the CRM
// niXaler gives each client to run their business, not niXaler's internal
// CRM of its own clients.
export const crmContacts = pgTable('crm_contacts', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerId: uuid('owner_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  company: text('company'),
  stage: crmStageEnum('stage').default('lead').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const crmTasks = pgTable('crm_tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  contactId: uuid('contact_id').references(() => crmContacts.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  dueAt: timestamp('due_at', { withTimezone: true }),
  done: boolean('done').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
