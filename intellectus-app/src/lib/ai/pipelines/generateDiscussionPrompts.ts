import { z } from 'zod';
import { getAiProvider } from '../provider';
import { db } from '@/lib/db/client';
import { discussionPrompts } from '@/lib/db/schema';

const promptsSchema = z.object({
  prompts: z.array(z.string()).min(2).max(3),
});

// Dynamic Discussion Prompts (#2) — reuses the same text-generation
// interface as buildDailyStack, just a different prompt template.
export async function generateDiscussionPrompts(params: { articleId: string; topicTitle: string; summary: string }) {
  const provider = getAiProvider();

  const result = await provider.generateStructured({
    system:
      'You write discussion prompts for a civil-discourse news app. Prompts must be genuinely ' +
      'polarizing on substance while staying respectful in tone — no loaded language, no strawmen.',
    prompt: [
      `Topic: ${params.topicTitle}`,
      `Summary: ${params.summary}`,
      '',
      'Write 2-3 discussion prompts that invite well-reasoned disagreement, not reflexive reactions.',
      'Return { "prompts": ["...", "..."] }.',
    ].join('\n'),
    schema: promptsSchema,
  });

  const rows = result.prompts.map((promptText) => ({
    articleId: params.articleId,
    promptText,
    generatedBy: 'ai' as const,
  }));

  await db.insert(discussionPrompts).values(rows);

  return rows;
}
