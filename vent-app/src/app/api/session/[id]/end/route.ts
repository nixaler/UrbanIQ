import { NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { ventSessions } from '@/lib/db/schema';
import { getCurrentProfile } from '@/lib/auth/currentUser';
import { loadParticipantSession } from '@/lib/session/loadParticipantSession';

export const runtime = 'nodejs';

const bodySchema = z.object({
  endReason: z.enum(['completed', 'venter_left', 'listener_left', 'timeout', 'reported']).default('completed'),
});

// Transitions the live call into "awaiting_decision" — called by whichever
// participant's client timer fires first (the 60s countdown, see
// useVentTimer), or earlier if someone leaves/is reported. Idempotent: a
// second caller just gets the already-updated row back.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { id } = await params;
  const result = await loadParticipantSession(id, profile);
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status });

  if (result.session.callEndedAt) {
    return NextResponse.json({ session: result.session });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const [updated] = await db
    .update(ventSessions)
    .set({ status: 'awaiting_decision', endReason: parsed.data.endReason, callEndedAt: new Date() })
    .where(eq(ventSessions.id, id))
    .returning();

  return NextResponse.json({ session: updated });
}
