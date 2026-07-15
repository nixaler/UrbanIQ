import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { ventSessions } from '@/lib/db/schema';
import { getCurrentProfile } from '@/lib/auth/currentUser';
import { loadParticipantSession } from '@/lib/session/loadParticipantSession';
import { awardKarmaForCompletedSession } from '@/lib/karma/pointsEngine';

export const runtime = 'nodejs';

// Finalizes an open-ended (post-extend) call once either participant leaves.
// Distinct from /end (which only covers the initial timed 60s vent) because
// callEndedAt is reused as the "is the live call still open" flag and gets
// reset to null when an extend is accepted.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { id } = await params;
  const result = await loadParticipantSession(id, profile);
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status });

  if (result.session.status !== 'extended') {
    return NextResponse.json({ session: result.session });
  }

  const [updated] = await db
    .update(ventSessions)
    .set({ status: 'completed', callEndedAt: new Date() })
    .where(eq(ventSessions.id, id))
    .returning();

  if (updated) await awardKarmaForCompletedSession(updated);

  return NextResponse.json({ session: updated });
}
