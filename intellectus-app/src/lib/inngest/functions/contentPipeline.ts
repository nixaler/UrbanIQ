import { inngest } from '../client';
import { buildDailyStackBlocks } from '@/lib/ai/pipelines/buildDailyStack';
import { generateDiscussionPrompts } from '@/lib/ai/pipelines/generateDiscussionPrompts';
import { db } from '@/lib/db/client';
import { articles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * Orchestrates the daily content pipeline: draft atomic blocks, draft
 * discussion prompts, then leave the article in `in_review` for a human
 * editor to approve before it goes live (Human-in-the-Loop Badging, #10).
 * Narration (#19) and the weekend digest (#15) reuse these same steps'
 * output rather than re-deriving content, kept as separate functions below
 * so a narration failure can't block publishing.
 */
export const contentPipeline = inngest.createFunction(
  { id: 'content-pipeline', retries: 3 },
  { event: 'content/pipeline.requested' },
  async ({ event, step }) => {
    const { articleId, topicTitle, sourceMaterial } = event.data;

    await step.run('generate-atomic-blocks', () =>
      buildDailyStackBlocks({ articleId, topicTitle, sourceMaterial }),
    );

    await step.run('generate-discussion-prompts', () =>
      generateDiscussionPrompts({
        articleId,
        topicTitle,
        summary: sourceMaterial.slice(0, 500),
      }),
    );

    await step.run('mark-in-review', () =>
      db.update(articles).set({ status: 'in_review' }).where(eq(articles.id, articleId)),
    );

    return { articleId, status: 'in_review' };
  },
);
