import { NextResponse } from 'next/server';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { queueEntries, ventSessions } from '@/lib/db/schema';
import { getCurrentProfile } from '@/lib/auth/currentUser';
import { runMatchCycle } from '@/lib/matching/matcher';

export const runtime = 'nodejs';

const bodySchema = z.object({
  role: z.enum(['venter', 'listener']),
  topicId: z.string().uuid().optional(),
  sessionId: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (!profile.tosAcceptedAt) return NextResponse.json({ error: 'Consent required' }, { status: 403 });
  if (profile.status !== 'active') return NextResponse.json({ error: 'Account restricted' }, { status: 403 });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { role, topicId, sessionId } = parsed.data;

  if (role === 'venter') {
    if (!sessionId) return NextResponse.json({ error: 'sessionId required for venter' }, { status: 400 });
    const [session] = await db
      .select()
      .from(ventSessions)
      .where(and(eq(ventSessions.id, sessionId), eq(ventSessions.venterId, profile.id)))
      .limit(1);
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  } else {
    // Listener Academy gate — see Milestone 2. A user's first role='listener'
    // queue entry requires having passed the empathy quiz.
    if (!profile.listenerCertifiedAt) {
      return NextResponse.json({ error: 'listener_academy_required' }, { status: 403 });
    }
  }

  const [entry] = await db
    .insert(queueEntries)
    .values({
      userId: profile.id,
      role,
      topicId: role === 'venter' ? topicId : (topicId ?? null),
      sessionId: role === 'venter' ? sessionId : null,
    })
    .returning();

  const match = await runMatchCycle();

  return NextResponse.json({ queueEntry: entry, match });
}
