import { eq, asc } from 'drizzle-orm';
import { requireConsent } from '@/lib/auth/requireConsent';
import { db } from '@/lib/db/client';
import { topics } from '@/lib/db/schema';
import { TopicGrid } from '@/components/topics/TopicGrid';

export default async function TopicsPage() {
  await requireConsent('/topics');

  const activeTopics = await db
    .select()
    .from(topics)
    .where(eq(topics.isActive, true))
    .orderBy(asc(topics.sortOrder));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">What&apos;s on your mind?</h1>
        <p className="text-ink-muted">Pick a topic. You&apos;ll get 60 seconds to say what you need to say.</p>
      </div>
      <TopicGrid topics={activeTopics} />
    </div>
  );
}
