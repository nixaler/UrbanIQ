import Link from 'next/link';
import { db } from '@/lib/db/client';
import { articles, topics } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

// The daily stack changes every day — never statically prerender this at
// build time (and doing so would also require a live DB connection to exist
// during `next build`, which isn't guaranteed in CI).
export const dynamic = 'force-dynamic';

export default async function HomePage() {
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

  return (
    <main className="min-h-screen bg-[rgb(var(--nr-bg))] text-[rgb(var(--nr-ink))]">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold tracking-tight mb-8">Today's stack</h1>

        {publishedArticles.length === 0 && (
          <p className="text-[rgb(var(--nr-ink-muted))]">
            No published tracks yet — run the seed script or the content pipeline.
          </p>
        )}

        <ul className="space-y-4">
          {publishedArticles.map((article) => (
            <li key={article.id}>
              <Link
                href={`/article/${article.id}`}
                className="block p-5 rounded-lg border border-[rgb(var(--nr-border))] bg-[rgb(var(--nr-bg-raised))] hover:border-[rgb(var(--nr-accent)/0.5)] transition-colors"
              >
                <span className="text-xs uppercase tracking-widest text-[rgb(var(--nr-accent))] font-semibold">
                  {article.topicName}
                </span>
                <h2 className="text-lg font-semibold mt-1">{article.title}</h2>
                <span className="text-xs text-[rgb(var(--nr-ink-muted))]">{article.publishDate}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
