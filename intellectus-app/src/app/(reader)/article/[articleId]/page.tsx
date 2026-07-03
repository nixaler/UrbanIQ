import { notFound } from 'next/navigation';
import { db } from '@/lib/db/client';
import { eq } from 'drizzle-orm';
import { articles, contentBlocks, topics } from '@/lib/db/schema';
import ArticleShellClient from '@/components/reading/ArticleShellClient';

interface ArticlePageProps {
  params: Promise<{ articleId: string }>;
}

// Plain Node.js runtime (the default) — this route queries Postgres through
// Drizzle's postgres-js driver, which opens a raw TCP socket the Edge
// Runtime cannot support. Edge-cached hydration (#29) is a deliberate
// Phase 6 item once a fetch/HTTP-based driver is wired in; forcing
// `runtime = 'edge'` here today would break at request time.
export const dynamic = 'force-dynamic';

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { articleId } = await params;

  const [article] = await db
    .select({
      id: articles.id,
      title: articles.title,
      publishDate: articles.publishDate,
      topicName: topics.title,
    })
    .from(articles)
    .innerJoin(topics, eq(articles.topicId, topics.id))
    .where(eq(articles.id, articleId))
    .limit(1);

  if (!article) {
    notFound();
  }

  const rawBlocks = await db
    .select({
      id: contentBlocks.id,
      blockType: contentBlocks.blockType,
      depthLevel: contentBlocks.depthLevel,
      body: contentBlocks.body,
    })
    .from(contentBlocks)
    .where(eq(contentBlocks.articleId, articleId));

  const serializedBlocks = rawBlocks.map((block) => ({
    id: block.id,
    type: block.blockType,
    depth: block.depthLevel,
    content: block.body,
  }));

  return (
    <main className="min-h-screen bg-[rgb(var(--nr-bg))] text-[rgb(var(--nr-ink))] selection:bg-[rgb(var(--nr-accent)/0.25)]">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <header className="mb-8 border-b border-[rgb(var(--nr-border))] pb-6">
          <span className="text-xs uppercase tracking-widest text-[rgb(var(--nr-accent))] font-semibold">
            {article.topicName}
          </span>
          <h1 className="text-3xl font-bold tracking-tight mt-2">{article.title}</h1>
          <div className="text-xs text-[rgb(var(--nr-ink-muted))] mt-2 font-mono">
            Published: {article.publishDate} · Verified human curation checked
          </div>
        </header>

        <ArticleShellClient articleId={article.id} initialBlocks={serializedBlocks} />
      </div>
    </main>
  );
}
