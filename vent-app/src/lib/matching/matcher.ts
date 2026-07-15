import 'server-only';
import { and, asc, eq, isNull, or, sql } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { queueEntries, ventSessions, profiles, blocks } from '@/lib/db/schema';
import { createRoom } from '@/lib/daily/client';

const ROOM_CEILING_MINUTES = 60;
// If no lived-experience overlap materializes within this many match cycles
// (roughly one poll interval each), stop preferring tag overlap so a rare
// tag combination can never turn into outright queue starvation.
const TAG_PREFERENCE_GRACE_CYCLES = 1;

interface MatchResult {
  sessionId: string;
  dailyRoomUrl: string;
}

/**
 * Runs one pairing attempt inside a single DB transaction using
 * `FOR UPDATE SKIP LOCKED` so concurrent calls (from concurrent polls) never
 * double-book the same queue entry. Prefers, but never requires, an overlap
 * between both users' optional `identityTags` ("lived experience" matching).
 *
 * Returns null if no pair could be formed this cycle (the caller should just
 * let the client keep polling / waiting).
 */
export async function runMatchCycle(): Promise<MatchResult | null> {
  const matched = await db.transaction(async (tx) => {
    const [venterEntry] = await tx
      .select()
      .from(queueEntries)
      .where(and(eq(queueEntries.role, 'venter'), eq(queueEntries.status, 'waiting')))
      .orderBy(asc(queueEntries.enqueuedAt))
      .limit(1)
      .for('update', { skipLocked: true });

    // A venter always enqueues with a specific topicId (enforced in
    // POST /api/queue/enqueue) — topicId is only ever null for listeners.
    if (!venterEntry || !venterEntry.sessionId || !venterEntry.topicId) return null;
    const venterTopicId = venterEntry.topicId;

    const candidates = await tx
      .select({ entry: queueEntries, identityTags: profiles.identityTags })
      .from(queueEntries)
      .innerJoin(profiles, eq(profiles.id, queueEntries.userId))
      .where(
        and(
          eq(queueEntries.role, 'listener'),
          eq(queueEntries.status, 'waiting'),
          or(eq(queueEntries.topicId, venterTopicId), isNull(queueEntries.topicId)),
          sql`not exists (
            select 1 from ${blocks}
            where (${blocks.blockerId} = ${venterEntry.userId} and ${blocks.blockedUserId} = ${queueEntries.userId})
               or (${blocks.blockerId} = ${queueEntries.userId} and ${blocks.blockedUserId} = ${venterEntry.userId})
          )`
        )
      )
      .orderBy(asc(queueEntries.enqueuedAt))
      .limit(20)
      .for('update', { skipLocked: true });

    if (candidates.length === 0) return null;

    const [venterProfile] = await tx
      .select({ identityTags: profiles.identityTags })
      .from(profiles)
      .where(eq(profiles.id, venterEntry.userId))
      .limit(1);
    const venterTags = new Set(venterProfile?.identityTags ?? []);

    const now = Date.now();
    const waitedCycles = (now - venterEntry.enqueuedAt.getTime()) / 1000 / 2; // ~2s poll interval
    const preferTags = waitedCycles < TAG_PREFERENCE_GRACE_CYCLES || venterTags.size === 0;

    const ranked = candidates
      .map(({ entry, identityTags }) => ({
        entry,
        overlap: preferTags ? (identityTags ?? []).filter((t) => venterTags.has(t)).length : 0,
      }))
      .sort((a, b) => b.overlap - a.overlap || a.entry.enqueuedAt.getTime() - b.entry.enqueuedAt.getTime());

    const chosen = ranked[0];
    if (!chosen) return null;
    const listenerEntry = chosen.entry;

    const matchedAt = new Date();

    await tx
      .update(ventSessions)
      .set({ listenerId: listenerEntry.userId, status: 'matched' })
      .where(eq(ventSessions.id, venterEntry.sessionId));

    await tx
      .update(queueEntries)
      .set({ status: 'matched', matchedAt, sessionId: venterEntry.sessionId })
      .where(eq(queueEntries.id, venterEntry.id));

    await tx
      .update(queueEntries)
      .set({ status: 'matched', matchedAt, sessionId: venterEntry.sessionId })
      .where(eq(queueEntries.id, listenerEntry.id));

    return { sessionId: venterEntry.sessionId };
  });

  if (!matched) return null;

  // Daily room creation happens outside the transaction — it's an external
  // network call and shouldn't hold DB locks open while it's in flight.
  return createRoomForMatchedSession(matched.sessionId);
}

async function createRoomForMatchedSession(sessionId: string): Promise<MatchResult> {
  const [session] = await db.select().from(ventSessions).where(eq(ventSessions.id, sessionId)).limit(1);
  if (!session) throw new Error(`Session ${sessionId} vanished after match`);

  if (session.dailyRoomUrl) {
    return { sessionId, dailyRoomUrl: session.dailyRoomUrl };
  }

  const expiresAt = new Date(Date.now() + ROOM_CEILING_MINUTES * 60 * 1000);
  const room = await createRoom({ cameraOff: session.cameraMode === 'off', expiresAt });

  await db
    .update(ventSessions)
    .set({ dailyRoomName: room.name, dailyRoomUrl: room.url, dailyRoomExpiresAt: expiresAt })
    .where(eq(ventSessions.id, sessionId));

  return { sessionId, dailyRoomUrl: room.url };
}
