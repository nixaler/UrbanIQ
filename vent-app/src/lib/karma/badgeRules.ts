import 'server-only';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { karmaLedger, badges, userBadges } from '@/lib/db/schema';

export const BADGE_SLUGS = {
  DEEP_LISTENER: 'deep-listener',
  MIDNIGHT_ALLY: 'midnight-ally',
} as const;

const DEEP_LISTENER_THRESHOLD = 50;

// Earned privately, shown on the user's own garden page — never a
// leaderboard or comparison against other users.
export async function checkAndAwardBadges(userId: string, sessionEndedAtHourUTC: number) {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(karmaLedger)
    .where(and(eq(karmaLedger.userId, userId), inArray(karmaLedger.reasonCode, ['listened_full_vent', 'extend_call_completed'])));

  if ((row?.count ?? 0) >= DEEP_LISTENER_THRESHOLD) {
    await awardBadge(userId, BADGE_SLUGS.DEEP_LISTENER);
  }

  // "Late night" defined as midnight-5am UTC — a simple, timezone-naive proxy
  // good enough for a badge, not for anything load-bearing.
  if (sessionEndedAtHourUTC >= 0 && sessionEndedAtHourUTC < 5) {
    await awardBadge(userId, BADGE_SLUGS.MIDNIGHT_ALLY);
  }
}

async function awardBadge(userId: string, slug: string) {
  const [badge] = await db.select().from(badges).where(eq(badges.slug, slug)).limit(1);
  if (!badge) return;
  await db.insert(userBadges).values({ userId, badgeId: badge.id }).onConflictDoNothing();
}

export async function seedBadges() {
  await db
    .insert(badges)
    .values([
      {
        slug: BADGE_SLUGS.DEEP_LISTENER,
        name: 'Deep Listener',
        description: `Completed ${DEEP_LISTENER_THRESHOLD} listening sessions.`,
      },
      {
        slug: BADGE_SLUGS.MIDNIGHT_ALLY,
        name: 'Midnight Ally',
        description: 'Showed up to listen late at night.',
      },
    ])
    .onConflictDoNothing();
}
