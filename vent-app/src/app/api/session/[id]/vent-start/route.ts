import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { ventSessions } from '@/lib/db/schema';
import { getCurrentProfile } from '@/lib/auth/currentUser';
import { loadParticipantSession } from '@/lib/session/loadParticipantSession';

export const runtime = 'nodejs';

// Server-authoritative start-of-vent timestamp. Idempotent: whichever
// participant's client observes `joined-meeting` first calls this; the
// second caller just gets back the timestamp the first call already set.
// Never trust a client clock for the 60s boundary — see plan §5.
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { id } = await params;
  const result = await loadParticipantSession(id, profile);
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status });

  if (result.session.ventStartedAt) {
    return NextResponse.json({ session: result.session });
  }

  const [updated] = await db
    .update(ventSessions)
    .set({ ventStartedAt: new Date(), status: 'venting' })
    .where(eq(ventSessions.id, id))
    .returning();

  return NextResponse.json({ session: updated });
}
