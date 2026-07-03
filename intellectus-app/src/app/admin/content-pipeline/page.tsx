import { db } from '@/lib/db/client';
import { articles, topics } from '@/lib/db/schema';
import { eq, ne } from 'drizzle-orm';
import { requireRoleForPage } from '@/lib/auth/guards';
import PublishButton from '@/components/layout/PublishButton';

export const dynamic = 'force-dynamic';

export default async function ContentPipelinePage() {
  await requireRoleForPage('editor', '/admin/content-pipeline');

  const pending = await db
    .select({ id: articles.id, title: articles.title, status: articles.status, topicName: topics.title })
    .from(articles)
    .innerJoin(topics, eq(articles.topicId, topics.id))
    .where(ne(articles.status, 'published'));

  return (
    <main className="min-h-screen bg-[rgb(var(--nr-bg))] text-[rgb(var(--nr-ink))]">
      <div className="max-w-2xl mx-auto px-6 py-12 space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Content pipeline</h1>
        <p className="text-sm text-[rgb(var(--nr-ink-muted))]">
          Human-in-the-loop review: nothing goes live until an editor publishes it.
        </p>

        <ul className="space-y-2">
          {pending.map((a) => (
            <li key={a.id} className="flex items-center justify-between p-3 rounded-lg border border-[rgb(var(--nr-border))]">
              <div>
                <span className="text-xs uppercase tracking-wide text-[rgb(var(--nr-accent))]">{a.topicName}</span>
                <div className="font-medium">
                  {a.title} <span className="text-xs text-[rgb(var(--nr-ink-muted))]">({a.status})</span>
                </div>
              </div>
              <PublishButton articleId={a.id} />
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
