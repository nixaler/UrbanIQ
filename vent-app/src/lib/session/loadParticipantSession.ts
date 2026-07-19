import 'server-only';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { ventSessions } from '@/lib/db/schema';
import type { profiles } from '@/lib/db/schema';

type Profile = typeof profiles.$inferSelect;

export async function loadParticipantSession(sessionId: string, profile: Profile) {
  const [session] = await db.select().from(ventSessions).where(eq(ventSessions.id, sessionId)).limit(1);
  if (!session) return { error: 'Not found' as const, status: 404 as const };
  if (session.venterId !== profile.id && session.listenerId !== profile.id) {
    return { error: 'Forbidden' as const, status: 403 as const };
  }
  return { session };
}
