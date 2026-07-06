'use server';

import { revalidateTag } from 'next/cache';
import { db } from '@/lib/db/client';
import { articles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireRole } from '@/lib/auth/guards';
import { inngest } from '@/lib/inngest/client';

/**
 * The moment content actually changes is the moment the cached base-layout
 * data (getArticleBaseData) must invalidate — see that file's comment for
 * why this app caches by tag instead of forcing edge runtime.
 */
export async function publishArticle(articleId: string) {
  await requireRole('editor');

  await db.update(articles).set({ status: 'published' }).where(eq(articles.id, articleId));
  revalidateTag(`article:${articleId}`);

  await inngest.send({ name: 'content/narration.requested', data: { articleId } });
}
