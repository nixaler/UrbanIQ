import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/client';
import { reports, ventSessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentProfile } from '@/lib/auth/currentUser';

export const runtime = 'nodejs';

const bodySchema = z.object({
  sessionId: z.string().uuid(),
  reportedUserId: z.string().uuid(),
  reasonCode: z.enum(['harassment', 'hate_speech', 'self_harm_risk', 'sexual_content', 'spam', 'other']),
  note: z.string().max(1000).optional(),
});

export async function POST(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const [session] = await db.select().from(ventSessions).where(eq(ventSessions.id, parsed.data.sessionId)).limit(1);
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (session.venterId !== profile.id && session.listenerId !== profile.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // self_harm_risk auto-escalates to critical severity — the single
  // highest-priority moderation rule in this pragmatic (non-AI-moderated) design.
  const severity = parsed.data.reasonCode === 'self_harm_risk' ? 'critical' : 'medium';

  const [report] = await db
    .insert(reports)
    .values({
      sessionId: parsed.data.sessionId,
      reporterId: profile.id,
      reportedUserId: parsed.data.reportedUserId,
      reasonCode: parsed.data.reasonCode,
      note: parsed.data.note,
      severity,
    })
    .returning();

  return NextResponse.json({ report });
}
