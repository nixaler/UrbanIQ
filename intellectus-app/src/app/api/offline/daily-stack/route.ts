import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { articles, topics, contentBlocks } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

// Backs the Local-First Caching Framework (#30): returns today's published
// stack as plain JSON so the client can silently write it into IndexedDB
// (see src/lib/offline/dailyStackCache.ts) the moment the app opens.
export async function GET() {
  const publishedArticles = await db
    .select({
      id: articles.id,
      title: articles.title,
      publishDate: articles.publishDate,
      topicName: topics.title,
    })
    .from(articles)
    .innerJoin(topics, eq(articles.topicId, topics.id))
    .where(eq(articles.status, 'published'))
    .orderBy(desc(articles.publishDate))
    .limit(20);

  const stack = await Promise.all(
    publishedArticles.map(async (article) => {
      const blocks = await db
        .select({ blockType: contentBlocks.blockType, depthLevel: contentBlocks.depthLevel, body: contentBlocks.body })
        .from(contentBlocks)
        .where(eq(contentBlocks.articleId, article.id));
      return { ...article, blocks };
    }),
  );

  return NextResponse.json({ cachedAt: new Date().toISOString(), stack });
}
