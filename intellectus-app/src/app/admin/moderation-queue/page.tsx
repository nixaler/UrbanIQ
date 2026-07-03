import { db } from '@/lib/db/client';
import { moderationFlags } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { requireRoleForPage } from '@/lib/auth/guards';
import ModerationFlagRow from '@/components/layout/ModerationFlagRow';

export const dynamic = 'force-dynamic';

export default async function ModerationQueuePage() {
  await requireRoleForPage('moderator');

  const flags = await db.select().from(moderationFlags).orderBy(desc(moderationFlags.createdAt)).limit(100);

  return (
    <main className="min-h-screen bg-[rgb(var(--nr-bg))] text-[rgb(var(--nr-ink))]">
      <div className="max-w-2xl mx-auto px-6 py-12 space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Moderation queue</h1>
        <p className="text-sm text-[rgb(var(--nr-ink-muted))]">
          Shadow-banning is fully automated — this is an audit and override view, not the primary defense.
        </p>

        <ul className="space-y-2">
          {flags.map((flag) => (
            <ModerationFlagRow
              key={flag.id}
              id={flag.id}
              targetType={flag.targetType}
              targetId={flag.targetId}
              reason={flag.reason}
              status={flag.status}
              actionTaken={flag.actionTaken}
            />
          ))}
        </ul>
      </div>
    </main>
  );
}
