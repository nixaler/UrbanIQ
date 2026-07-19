import { eq, desc } from 'drizzle-orm';
import { requireConsent } from '@/lib/auth/requireConsent';
import { getCurrentProfile } from '@/lib/auth/currentUser';
import { db } from '@/lib/db/client';
import { gardenState, userBadges, badges, moodCheckins } from '@/lib/db/schema';
import { EmpathyGarden } from '@/components/karma/EmpathyGarden';
import { BadgeList } from '@/components/karma/BadgeList';
import { MoodTrendChart } from '@/components/journaling/MoodTrendChart';
import { featureFlags } from '@/lib/config/featureFlags';

export default async function GardenPage() {
  await requireConsent('/profile/garden');
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const [garden] = await db.select().from(gardenState).where(eq(gardenState.userId, profile.id)).limit(1);

  const earnedBadges = await db
    .select({ id: badges.id, name: badges.name, description: badges.description, earnedAt: userBadges.earnedAt })
    .from(userBadges)
    .innerJoin(badges, eq(badges.id, userBadges.badgeId))
    .where(eq(userBadges.userId, profile.id));

  const moodEntries = await db
    .select({ moodBefore: moodCheckins.moodBefore, moodAfter: moodCheckins.moodAfter, createdAt: moodCheckins.createdAt })
    .from(moodCheckins)
    .where(eq(moodCheckins.userId, profile.id))
    .orderBy(desc(moodCheckins.createdAt))
    .limit(30);

  if (!featureFlags.karmaEnabled) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Your Garden</h1>
        <p className="text-ink-muted">
          The Empathy Garden isn&apos;t live yet — check back soon. Your mood check-ins are still
          being tracked below.
        </p>
        <MoodTrendChart
          entries={moodEntries.map((e) => ({ ...e, createdAt: e.createdAt.toISOString() }))}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Your Garden</h1>
      <EmpathyGarden droplets={garden?.droplets ?? 0} bloomStage={garden?.bloomStage ?? 0} />
      <div>
        <h2 className="mb-2 text-lg font-medium">Badges</h2>
        <BadgeList badges={earnedBadges.map((b) => ({ ...b, earnedAt: b.earnedAt.toISOString() }))} />
      </div>
      <div>
        <h2 className="mb-2 text-lg font-medium">Your mood over time</h2>
        <MoodTrendChart
          entries={moodEntries.map((e) => ({ ...e, createdAt: e.createdAt.toISOString() }))}
        />
      </div>
    </div>
  );
}
