import { z } from 'zod';
import { getAiProvider } from '../provider';
import { db } from '@/lib/db/client';
import { contentBlocks, blockTypeEnum, depthLevelEnum } from '@/lib/db/schema';

const blockSchema = z.object({
  blockType: z.enum(blockTypeEnum.enumValues),
  depthLevel: z.enum(depthLevelEnum.enumValues),
  text: z.string(),
});

// One structured call returns the full 3-depth x 4-5-block-type matrix for
// an article, instead of looping 12-15 individual generations. Looping is
// what the architecture audit flagged as a latency/drop-rate risk — this is
// the fix, implemented against the provider-agnostic interface so it isn't
// tied to any single vendor's context window.
const stackSchema = z.object({
  blocks: z.array(blockSchema).min(1),
});

export async function buildDailyStackBlocks(params: {
  articleId: string;
  topicTitle: string;
  sourceMaterial: string;
}) {
  const provider = getAiProvider();

  const result = await provider.generateStructured({
    system:
      'You are a careful, neutral news editor. Produce structured content blocks for a daily news reader. ' +
      'Stay factual and cite specifics from the source material. Never editorialize.',
    prompt: [
      `Topic: ${params.topicTitle}`,
      `Source material:\n${params.sourceMaterial}`,
      '',
      'Generate content blocks for every combination of blockType x depthLevel:',
      `blockType: ${blockTypeEnum.enumValues.join(', ')}`,
      `depthLevel: ${depthLevelEnum.enumValues.join(', ')}`,
      '',
      'summary depth: 1-2 sentences per block. standard depth: a short paragraph with context. ' +
      'deep depth: a longer paragraph including primary-source detail where relevant.',
      'Return { "blocks": [{ "blockType", "depthLevel", "text" }, ...] }.',
    ].join('\n'),
    schema: stackSchema,
    maxTokens: 8192,
  });

  const rows = result.blocks.map((block, index) => ({
    articleId: params.articleId,
    blockType: block.blockType,
    depthLevel: block.depthLevel,
    orderIndex: String(index),
    body: { text: block.text },
  }));

  await db.insert(contentBlocks).values(rows);

  return rows;
}
