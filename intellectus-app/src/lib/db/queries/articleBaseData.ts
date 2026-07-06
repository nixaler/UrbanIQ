import { unstable_cache } from 'next/cache';
import { db } from '@/lib/db/client';
import { eq, inArray } from 'drizzle-orm';
import {
  articles,
  topics,
  contentBlocks,
  perspectives,
  users,
  sponsors,
  provenanceRecords,
  narrations,
} from '@/lib/db/schema';

/**
 * Edge-Cached API Hydration (#29), adapted: Phase 0 found that forcing
 * `runtime = 'edge'` on a Drizzle/postgres-js route breaks at request time
 * (no raw TCP sockets on the Edge Runtime), so instead of a broken
 * edge+driver combo, the STABLE part of an article — everything except
 * live comments/votes — is cached here with a per-article tag and served
 * from cache on repeat requests. `publishArticle()` (lib/actions/articles.ts)
 * calls `revalidateTag` the moment content actually changes, so this never
 * serves stale published content; comments/votes stay fully live via
 * DiscussionSection's own uncached query + Realtime.
 */
export function getArticleBaseData(articleId: string) {
  return unstable_cache(
    async () => {
      const [article] = await db
        .select({
          id: articles.id,
          title: articles.title,
          publishDate: articles.publishDate,
          topicName: topics.title,
          humanEditorId: articles.humanEditorId,
          sponsorId: topics.sponsorId,
        })
        .from(articles)
        .innerJoin(topics, eq(articles.topicId, topics.id))
        .where(eq(articles.id, articleId))
        .limit(1);

      if (!article) return null;

      const [rawBlocks, perspectiveRows, editorRow, sponsorRow] = await Promise.all([
        db
          .select({
            id: contentBlocks.id,
            blockType: contentBlocks.blockType,
            depthLevel: contentBlocks.depthLevel,
            body: contentBlocks.body,
          })
          .from(contentBlocks)
          .where(eq(contentBlocks.articleId, articleId)),
        db
          .select({
            id: perspectives.id,
            factionName: perspectives.factionName,
            stanceSummary: perspectives.stanceSummary,
            argumentBody: perspectives.argumentBody,
            sourceUrl: perspectives.sourceUrl,
          })
          .from(perspectives)
          .where(eq(perspectives.articleId, articleId)),
        article.humanEditorId
          ? db
              .select({ displayName: users.displayName, avatarUrl: users.avatarUrl, role: users.role })
              .from(users)
              .where(eq(users.id, article.humanEditorId))
              .limit(1)
              .then((rows) => rows[0] ?? null)
          : Promise.resolve(null),
        article.sponsorId
          ? db
              .select({ companyName: sponsors.companyName, disclosureCopy: sponsors.disclosureCopy })
              .from(sponsors)
              .where(eq(sponsors.id, article.sponsorId))
              .limit(1)
              .then((rows) => rows[0] ?? null)
          : Promise.resolve(null),
      ]);

      const blockIds = rawBlocks.map((b) => b.id);
      const provenanceRows = blockIds.length
        ? await db
            .select({
              contentBlockId: provenanceRecords.contentBlockId,
              verified: provenanceRecords.verified,
              sourceUrl: provenanceRecords.sourceUrl,
            })
            .from(provenanceRecords)
            .where(inArray(provenanceRecords.contentBlockId, blockIds))
        : [];

      const narrationRows = await db.select().from(narrations).where(eq(narrations.articleId, articleId));

      return { article, rawBlocks, perspectiveRows, editorRow, sponsorRow, provenanceRows, narrationRows };
    },
    [`article-base-data:${articleId}`],
    { tags: [`article:${articleId}`] },
  )();
}
