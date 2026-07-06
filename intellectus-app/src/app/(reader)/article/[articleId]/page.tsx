import { notFound } from 'next/navigation';
import { db } from '@/lib/db/client';
import { eq } from 'drizzle-orm';
import { microPollResponses } from '@/lib/db/schema';
import { getArticleBaseData } from '@/lib/db/queries/articleBaseData';
import ArticleShellClient from '@/components/reading/ArticleShellClient';
import Perspectives from '@/components/reading/Perspectives';
import NarrationPlayer from '@/components/reading/NarrationPlayer';
import type { DepthLevel } from '@/hooks/useDepthPreference';
import EditorCredentialCard from '@/components/badges/EditorCredentialCard';
import SponsorDisclosureBadge from '@/components/badges/SponsorDisclosureBadge';
import DiscussionSection from '@/components/discussion/DiscussionSection';
import { buildNewsArticleJsonLd } from '@/lib/seo/jsonLdBuilders';
import { getCurrentUserProfile } from '@/lib/auth/session';

interface ArticlePageProps {
  params: Promise<{ articleId: string }>;
}

// Plain Node.js runtime (the default) — this route queries Postgres through
// Drizzle's postgres-js driver, which opens a raw TCP socket the Edge
// Runtime cannot support. getArticleBaseData() below gets the caching
// benefit item #29 was after, via unstable_cache + tag revalidation,
// without needing the edge runtime at all.
export const dynamic = 'force-dynamic';

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { articleId } = await params;

  const [baseData, viewer] = await Promise.all([getArticleBaseData(articleId), getCurrentUserProfile()]);

  if (!baseData) {
    notFound();
  }
  const { article, rawBlocks, perspectiveRows, editorRow, sponsorRow, provenanceRows, narrationRows } = baseData;

  const provenanceByBlock = new Map(provenanceRows.map((p) => [p.contentBlockId, p]));

  const narrationsByDepth: Partial<Record<DepthLevel, { audioUrl: string; durationMs: number }>> = {};
  for (const row of narrationRows) {
    const durationMs = row.transcriptSync?.length ? row.transcriptSync[row.transcriptSync.length - 1]!.endMs : 0;
    narrationsByDepth[row.depthLevel] = { audioUrl: row.audioUrl, durationMs };
  }

  const pollMarkers = rawBlocks.map((b) => b.body?.poll?.positionMarker).filter((v): v is string => Boolean(v));
  const pollRows = pollMarkers.length
    ? await db.select().from(microPollResponses).where(eq(microPollResponses.articleId, articleId))
    : [];

  const serializedBlocks = rawBlocks.map((block) => {
    const positionMarker = block.body?.poll?.positionMarker;
    let pollData: { counts: Record<string, number>; viewerChoice: string | null } | undefined;
    if (positionMarker) {
      const responsesForMarker = pollRows.filter((r) => r.positionMarker === positionMarker);
      const counts: Record<string, number> = {};
      for (const r of responsesForMarker) counts[r.choice] = (counts[r.choice] ?? 0) + 1;
      const viewerChoice = viewer ? responsesForMarker.find((r) => r.userId === viewer.id)?.choice ?? null : null;
      pollData = { counts, viewerChoice };
    }

    return {
      id: block.id,
      type: block.blockType,
      depth: block.depthLevel,
      content: block.body,
      provenance: provenanceByBlock.get(block.id) ?? null,
      pollData,
    };
  });

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
          {sponsorRow && (
            <div className="mt-3">
              <SponsorDisclosureBadge companyName={sponsorRow.companyName} disclosureCopy={sponsorRow.disclosureCopy} />
            </div>
          )}
        </header>

        <ArticleShellClient articleId={article.id} initialBlocks={serializedBlocks} />

        <NarrationPlayer narrationsByDepth={narrationsByDepth} />

        <Perspectives perspectives={perspectiveRows} />

        <DiscussionSection articleId={article.id} viewerId={viewer?.id ?? null} />
      </div>
    </main>
  );
}
