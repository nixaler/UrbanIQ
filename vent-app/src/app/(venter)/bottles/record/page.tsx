import { eq, asc } from 'drizzle-orm';
import { requireConsent } from '@/lib/auth/requireConsent';
import { db } from '@/lib/db/client';
import { topics } from '@/lib/db/schema';
import { BottleRecordFlow } from '@/components/bottles/BottleRecordFlow';

export default async function RecordBottlePage() {
  await requireConsent('/bottles/record');

  const activeTopics = await db
    .select()
    .from(topics)
    .where(eq(topics.isActive, true))
    .orderBy(asc(topics.sortOrder));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Message in a Bottle</h1>
        <p className="text-ink-muted">
          No listeners online right now — record your 60-second vent anyway. A listener will hear
          it and can send a reply when they&apos;re back.
        </p>
      </div>
      <BottleRecordFlow topics={activeTopics} />
    </div>
  );
}
