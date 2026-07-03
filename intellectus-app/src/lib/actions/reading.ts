'use server';

import { db } from '@/lib/db/client';
import { contentBlocks, readingProgress } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireUser } from '@/lib/auth/guards';
import { computeMinReadSeconds, READ_GATE_SCROLL_THRESHOLD } from '@/lib/reading/thresholds';

export async function updateReadingProgress(params: {
  articleId: string;
  scrollPct: number;
  timeSpentSeconds: number;
}) {
  const user = await requireUser();
  const { articleId, scrollPct, timeSpentSeconds } = params;

  const blocks = await db
    .select({ body: contentBlocks.body })
    .from(contentBlocks)
    .where(eq(contentBlocks.articleId, articleId));

  const wordCount = blocks.reduce((sum, block) => {
    const text = block.body?.text ?? '';
    return sum + (text.trim() ? text.trim().split(/\s+/).length : 0);
  }, 0);

  const minSeconds = computeMinReadSeconds(wordCount);
  const unlocked = scrollPct >= READ_GATE_SCROLL_THRESHOLD && timeSpentSeconds >= minSeconds;

  await db
    .insert(readingProgress)
    .values({
      userId: user.id,
      articleId,
      scrollPct,
      timeSpentSeconds,
      unlockedComments: unlocked,
    })
    .onConflictDoUpdate({
      target: [readingProgress.userId, readingProgress.articleId],
      set: { scrollPct, timeSpentSeconds, unlockedComments: unlocked, updatedAt: new Date() },
    });

  return { unlocked };
}
