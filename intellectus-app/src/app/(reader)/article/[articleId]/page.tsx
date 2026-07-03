import { notFound } from 'next/navigation';
import { db } from '@/lib/db/client';
import { eq } from 'drizzle-orm';
import { articles, contentBlocks, topics, perspectives, users } from '@/lib/db/schema';
import ArticleShellClient from '@/components/reading/ArticleShellClient';
import Perspectives from '@/components/reading/Perspectives';
import EditorCredentialCard from '@/components/badges/EditorCredentialCard';
import DiscussionSection from '@/components/discussion/DiscussionSection';
import { buildNewsArticleJsonLd } from '@/lib/seo/jsonLdBuilders';
import { getCurrentUserProfile } from '@/lib/auth/session';

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
      humanEditorId: articles.humanEditorId,
    })
    .from(articles)
    .innerJoin(topics, eq(articles.topicId, topics.id))
    .where(eq(articles.id, articleId))
    .limit(1);

  if (!article) {
    notFound();
  }

  const [rawBlocks, perspectiveRows, editorRow, viewer] = await Promise.all([
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
    getCurrentUserProfile(),
  ]);

  const serializedBlocks = rawBlocks.map((block) => ({
    id: block.id,
    type: block.blockType,
    depth: block.depthLevel,
    content: block.body,
  }));

  const jsonLd = buildNewsArticleJsonLd({
    headline: article.title,
    datePublished: article.publishDate,
    topicName: article.topicName,
    editorName: editorRow?.displayName,
    url: `/article/${article.id}`,
  });

  return (
    <main className="min-h-screen bg-[rgb(var(--nr-bg))] text-[rgb(var(--nr-ink))] selection:bg-[rgb(var(--nr-accent)/0.25)]">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-10">
        <header className="border-b border-[rgb(var(--nr-border))] pb-6">
          <span className="text-xs uppercase tracking-widest text-[rgb(var(--nr-accent))] font-semibold">
            {article.topicName}
          </span>
          <h1 className="text-3xl font-bold tracking-tight mt-2">{article.title}</h1>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-[rgb(var(--nr-ink-muted))] font-mono">
              Published: {article.publishDate}
            </span>
            <EditorCredentialCard editor={editorRow} />
          </div>
        </header>

        <ArticleShellClient articleId={article.id} initialBlocks={serializedBlocks} />

        <Perspectives perspectives={perspectiveRows} />

        <DiscussionSection articleId={article.id} viewerId={viewer?.id ?? null} />
      </div>
    </main>
  );
}
