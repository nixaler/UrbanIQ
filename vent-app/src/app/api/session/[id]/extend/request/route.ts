import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { ventSessions } from '@/lib/db/schema';
import { getCurrentProfile } from '@/lib/auth/currentUser';
import { loadParticipantSession } from '@/lib/session/loadParticipantSession';

export const runtime = 'nodejs';

// Either participant may request an extend, but in the intended flow it's the
// Listener choosing to keep listening — the Venter is the one who must then
// mutually consent via /extend/respond.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { id } = await params;
  const result = await loadParticipantSession(id, profile);
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status });

  if (result.session.status !== 'awaiting_decision') {
    return NextResponse.json({ error: 'Session is not awaiting a decision' }, { status: 409 });
  }

  const [updated] = await db
    .update(ventSessions)
    .set({ status: 'extend_requested', extendRequestedBy: profile.id })
    .where(eq(ventSessions.id, id))
    .returning();

  return NextResponse.json({ session: updated });
}
