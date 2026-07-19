import { NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { ventSessions, issues, issueFollows } from '@/lib/db/schema';
import { getCurrentProfile } from '@/lib/auth/currentUser';
import { loadParticipantSession } from '@/lib/session/loadParticipantSession';
import { awardKarmaForCompletedSession } from '@/lib/karma/pointsEngine';

export const runtime = 'nodejs';

// The Listener's final call, once the 60s vent has ended: Send Support or
// Follow Issue are both terminal here. Extend Call does NOT come through
// this route — it goes through /extend/request + /extend/respond instead,
// since it needs the Venter's mutual consent.
const bodySchema = z.object({ decision: z.enum(['send_support', 'follow_issue']) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { id } = await params;
  const result = await loadParticipantSession(id, profile);
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status });

  if (result.session.listenerId !== profile.id) {
    return NextResponse.json({ error: 'Only the listener can record a decision' }, { status: 403 });
  }
  if (result.session.status !== 'awaiting_decision') {
    return NextResponse.json({ error: 'Session is not awaiting a decision' }, { status: 409 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const [updated] = await db
    .update(ventSessions)
    .set({ status: 'completed', decision: parsed.data.decision })
    .where(eq(ventSessions.id, id))
    .returning();

  if (updated) await awardKarmaForCompletedSession(updated);

  // "Follow Issue" means the Listener wants to subscribe to updates on the
  // underlying systemic issue behind this vent, not just this one exchange.
  if (updated && parsed.data.decision === 'follow_issue') {
    const [issue] = await db
      .insert(issues)
      .values({ topicId: updated.topicId, createdFromSessionId: updated.id })
      .returning();
    if (issue) {
      await db.insert(issueFollows).values({ userId: profile.id, issueId: issue.id }).onConflictDoNothing();
    }
  }

  return NextResponse.json({ session: updated });
}
