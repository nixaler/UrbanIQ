import { inngest } from '../client';
import { narrateArticleDepth } from '@/lib/ai/pipelines/narrateArticle';

/**
 * Ambient Audio Integration (#19), split from contentPipeline.ts on
 * purpose: narration is a nice-to-have, and a TTS provider outage
 * shouldn't block an article from publishing. Triggered separately (e.g.
 * from the editor's publish action), not chained onto the main pipeline.
 */
export const narrationPipeline = inngest.createFunction(
  { id: 'narration-pipeline', retries: 2 },
  { event: 'content/narration.requested' },
  async ({ event, step }) => {
    const { articleId } = event.data;

    for (const depthLevel of ['summary', 'standard', 'deep'] as const) {
      await step.run(`narrate-${depthLevel}`, () => narrateArticleDepth({ articleId, depthLevel }));
    }

    return { articleId, status: 'narrated' };
  },
);
