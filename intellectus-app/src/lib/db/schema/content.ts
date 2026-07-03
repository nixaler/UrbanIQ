import { pgTable, uuid, text, jsonb, boolean, date, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';
import { sponsors } from './monetization';

export const blockTypeEnum = pgEnum('block_type', [
  'event',
  'backstory',
  'visual_data',
  'global_impact',
  'primary_source',
]);

export const depthLevelEnum = pgEnum('depth_level', ['summary', 'standard', 'deep']);

export const topics = pgTable('topics', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').unique().notNull(),
  title: text('title').notNull(),
  description: text('description'),
  sponsorId: uuid('sponsor_id').references(() => sponsors.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const articles = pgTable('articles', {
  id: uuid('id').defaultRandom().primaryKey(),
  topicId: uuid('topic_id').references(() => topics.id, { onDelete: 'cascade' }).notNull(),
  publishDate: date('publish_date').notNull(),
  title: text('title').notNull(),
  status: text('status').default('draft').notNull(), // draft | in_review | published
  humanEditorId: uuid('human_editor_id').references(() => users.id, { onDelete: 'set null' }),
  isPremiumArchive: boolean('is_premium_archive').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// The central join point between the Atomic Object framework (#8) and the
// Depth Toggle (#12): block_type is the atomic slot, depth_level is the tier.
// Toggling depth swaps which rows render — it never switches articles.
export const contentBlocks = pgTable('content_blocks', {
  id: uuid('id').defaultRandom().primaryKey(),
  articleId: uuid('article_id').references(() => articles.id, { onDelete: 'cascade' }).notNull(),
  blockType: blockTypeEnum('block_type').notNull(),
  depthLevel: depthLevelEnum('depth_level').notNull(),
  orderIndex: text('order_index').default('0').notNull(),
  body: jsonb('body').$type<{
    text?: string;
    markdown?: string;
    metrics?: { label: string; value: string }[];
    list?: string[];
    references?: { label: string; summary: string }[];
  }>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const perspectives = pgTable('perspectives', {
  id: uuid('id').defaultRandom().primaryKey(),
  articleId: uuid('article_id').references(() => articles.id, { onDelete: 'cascade' }).notNull(),
  factionName: text('faction_name').notNull(),
  stanceSummary: text('stance_summary').notNull(),
  argumentBody: text('argument_body').notNull(),
  sourceUrl: text('source_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// C2PA provenance tracker (#24) — attached to media referenced from a content block.
export const provenanceRecords = pgTable('provenance_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  contentBlockId: uuid('content_block_id').references(() => contentBlocks.id, { onDelete: 'cascade' }).notNull(),
  mediaUrl: text('media_url').notNull(),
  c2paManifest: jsonb('c2pa_manifest'),
  verified: boolean('verified').default(false).notNull(),
  sourceUrl: text('source_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Ambient audio narration (#19) — synthetic AI voice, one row per article+depth.
export const narrations = pgTable('narrations', {
  id: uuid('id').defaultRandom().primaryKey(),
  articleId: uuid('article_id').references(() => articles.id, { onDelete: 'cascade' }).notNull(),
  depthLevel: depthLevelEnum('depth_level').notNull(),
  audioUrl: text('audio_url').notNull(),
  voiceId: text('voice_id').notNull(),
  transcriptSync: jsonb('transcript_sync').$type<{ blockId: string; startMs: number; endMs: number }[]>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
