import 'server-only';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { karmaLedger, profiles, ventSessions } from '@/lib/db/schema';
import { featureFlags } from '@/lib/config/featureFlags';
import { updateGardenState } from './gardenState';
import { checkAndAwardBadges } from './badgeRules';

type VentSession = typeof ventSessions.$inferSelect;

const POINTS_LISTENED_FULL_VENT = 10;
const POINTS_EXTEND_CALL_COMPLETED = 15;

// Called from POST /api/session/[id]/end. Karma is behind NEXT_PUBLIC_KARMA_ENABLED
// (Milestone 3) — writing the ledger is cheap and harmless even while the UI
// surface is hidden, but we skip it while the feature is off so early testing
// doesn't accumulate ledger rows nobody asked for.
export async function awardKarmaForCompletedSession(session: VentSession) {
  if (!featureFlags.karmaEnabled) return;
  if (!session.listenerId) return;

  const wasExtended = session.decision === 'extend_call';
  const points = wasExtended ? POINTS_EXTEND_CALL_COMPLETED : POINTS_LISTENED_FULL_VENT;
  const reasonCode = wasExtended ? 'extend_call_completed' : 'listened_full_vent';

  await db.insert(karmaLedger).values({
    userId: session.listenerId,
    sessionId: session.id,
    points,
    reasonCode,
  });

  await db
    .update(profiles)
    .set({ totalKarma: sql`${profiles.totalKarma} + ${points}` })
    .where(eq(profiles.id, session.listenerId));

  await updateGardenState(session.listenerId, points);
  await checkAndAwardBadges(session.listenerId, new Date().getUTCHours());
}
