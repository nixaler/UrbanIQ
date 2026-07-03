import Link from 'next/link';
import { db } from '@/lib/db/client';
import { articles, topics, subscriptions } from '@/lib/db/schema';
import { and, desc, eq } from 'drizzle-orm';
import { getCurrentUserProfile } from '@/lib/auth/session';
import { PAYWALL_ENABLED } from '@/lib/config/featureFlags';

export const dynamic = 'force-dynamic';

/**
 * Weekend Catch-Up Vault (#15): historical stack, gated behind
 * `isPremiumArchive` only once PAYWALL_ENABLED is flipped on — per the
 * confirmed "free at launch" decision, everything here is open for now.
 */
export default async function VaultPage() {
  const [pastArticles, viewer] = await Promise.all([
    db
      .select({
        id: articles.id,
        title: articles.title,
        publishDate: articles.publishDate,
        topicName: topics.title,
        isPremiumArchive: articles.isPremiumArchive,
      })
      .from(articles)
      .innerJoin(topics, eq(articles.topicId, topics.id))
      .where(eq(articles.status, 'published'))
      .orderBy(desc(articles.publishDate))
      .limit(50),
    getCurrentUserProfile(),
  ]);

  let hasActiveSubscription = false;
  if (PAYWALL_ENABLED && viewer) {
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, viewer.id), eq(subscriptions.status, 'active')))
      .limit(1);
    hasActiveSubscription = Boolean(sub);
  }

  return (
    <main className="min-h-screen bg-[rgb(var(--nr-bg))] text-[rgb(var(--nr-ink))]">
      <div className="max-w-2xl mx-auto px-6 py-12 space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Weekend Vault</h1>
        <p className="text-sm text-[rgb(var(--nr-ink-muted))]">Catch up on everything you missed this week.</p>

        <ul className="space-y-3">
          {pastArticles.map((article) => {
            const locked = PAYWALL_ENABLED && article.isPremiumArchive && !hasActiveSubscription;
            return (
              <li key={article.id}>
                {locked ? (
                  <div className="p-4 rounded-lg border border-dashed border-[rgb(var(--nr-border))] text-sm text-[rgb(var(--nr-ink-muted))]">
                    {article.title} — subscribe to unlock the full archive
                  </div>
                ) : (
                  <Link
                    href={`/article/${article.id}`}
                    className="block p-4 rounded-lg border border-[rgb(var(--nr-border))] bg-[rgb(var(--nr-bg-raised))] hover:border-[rgb(var(--nr-accent)/0.5)]"
                  >
                    <span className="text-xs uppercase tracking-widest text-[rgb(var(--nr-accent))] font-semibold">
                      {article.topicName}
                    </span>
                    <div className="font-medium">{article.title}</div>
                    <span className="text-xs text-[rgb(var(--nr-ink-muted))]">{article.publishDate}</span>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
