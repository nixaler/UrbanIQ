import { requireConsent } from '@/lib/auth/requireConsent';
import { getCurrentProfile } from '@/lib/auth/currentUser';
import { db } from '@/lib/db/client';
import { topics } from '@/lib/db/schema';
import { eq, asc } from 'drizzle-orm';
import { ListenerQueueForm } from '@/components/topics/ListenerQueueForm';
import Link from 'next/link';

export default async function ListenerQueuePage() {
  await requireConsent('/queue');
  const profile = await getCurrentProfile();

  if (!profile?.listenerCertifiedAt) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Become a Listener</h1>
        <p className="text-ink-muted">
          Before you can listen to someone&apos;s vent, complete the short Listener Academy —
          it takes about 3 minutes and covers the basics of supportive listening.
        </p>
        <Link
          href="/listener-academy"
          className="inline-block rounded-md bg-accent px-4 py-2 font-medium text-white"
        >
          Start Listener Academy
        </Link>
      </div>
    );
  }

  const activeTopics = await db
    .select()
    .from(topics)
    .where(eq(topics.isActive, true))
    .orderBy(asc(topics.sortOrder));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Ready to listen?</h1>
        <p className="text-ink-muted">Pick a topic you feel ready to support, or listen to anything.</p>
      </div>
      <ListenerQueueForm topics={activeTopics} />
    </div>
  );
}
