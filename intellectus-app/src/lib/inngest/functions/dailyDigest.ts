import { inngest } from '../client';
import { db } from '@/lib/db/client';
import { articles, commentVotes, comments } from '@/lib/db/schema';
import { getAiProvider } from '@/lib/ai/provider';
import { z } from 'zod';
import { gte, sql } from 'drizzle-orm';

const digestSchema = z.object({
  entries: z.array(z.object({ title: z.string(), summary: z.string() })).min(1).max(3),
});

/**
 * Weekend Catch-Up Vault (#15): free automated digest of the week's top 3
 * most-discussed topics, reusing the same AI text interface as the daily
 * content pipeline rather than a separate summarizer.
 */
export const dailyDigest = inngest.createFunction(
  { id: 'weekend-digest' },
  { event: 'digest/weekly.requested' },
  async ({ event, step }) => {
    const { weekStartDate } = event.data;

    const topArticles = await step.run('rank-top-discussed', async () => {
      const rows = await db
        .select({
          articleId: comments.articleId,
          title: articles.title,
          voteCount: sql<number>`count(${commentVotes.id})`.as('vote_count'),
        })
        .from(comments)
        .innerJoin(articles, sql`${articles.id} = ${comments.articleId}`)
        .leftJoin(commentVotes, sql`${commentVotes.commentId} = ${comments.id}`)
        .where(gte(articles.publishDate, weekStartDate))
        .groupBy(comments.articleId, articles.title)
        .orderBy(sql`vote_count desc`)
        .limit(3);

      return rows;
    });

    const digest = await step.run('summarize-digest', () =>
      getAiProvider().generateStructured({
        system: 'You summarize a week of news discussion into a short, neutral digest.',
        prompt: `Top discussed topics this week: ${JSON.stringify(topArticles)}. Return { "entries": [{ "title", "summary" }, x3] }.`,
        schema: digestSchema,
      }),
    );

    return { weekStartDate, digest };
  },
);
