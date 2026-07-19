import { NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { ventSessions } from '@/lib/db/schema';
import { getCurrentProfile } from '@/lib/auth/currentUser';
import { loadParticipantSession } from '@/lib/session/loadParticipantSession';
import { awardKarmaForCompletedSession } from '@/lib/karma/pointsEngine';

export const runtime = 'nodejs';

const bodySchema = z.object({ accept: z.boolean() });

// Only the participant who did NOT request the extend may respond — this is
// the mutual-consent half of the flow.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { id } = await params;
  const result = await loadParticipantSession(id, profile);
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status });

  if (result.session.status !== 'extend_requested') {
    return NextResponse.json({ error: 'No pending extend request' }, { status: 409 });
  }
  if (result.session.extendRequestedBy === profile.id) {
    return NextResponse.json({ error: 'Cannot respond to your own request' }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const [updated] = await db
    .update(ventSessions)
    .set(
      parsed.data.accept
        ? {
            status: 'extended',
            decision: 'extend_call',
            extendAccepted: true,
            extendRespondedAt: new Date(),
            // Reopens the "live call" window so /extend/end can later close
            // it out — callEndedAt was already set by the original 60s /end.
            callEndedAt: null,
          }
        : {
            status: 'completed',
            extendAccepted: false,
            extendRespondedAt: new Date(),
            callEndedAt: new Date(),
          }
    )
    .where(eq(ventSessions.id, id))
    .returning();

  // Declining still means the listener heard the full 60s vent — award the
  // standard karma. (Accepting awards karma later, from /extend/end, once
  // the open-ended call actually finishes.)
  if (updated && !parsed.data.accept) await awardKarmaForCompletedSession(updated);

  return NextResponse.json({ session: updated });
}
