import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/client';
import { moodCheckins, ventSessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentProfile } from '@/lib/auth/currentUser';

export const runtime = 'nodejs';

const bodySchema = z.object({
  sessionId: z.string().uuid(),
  moodBefore: z.number().int().min(1).max(5).optional(),
  moodAfter: z.number().int().min(1).max(5),
});

// Venter-only — listeners aren't asked to quantify someone else's feelings.
// Private to the user: never shared, never aggregated into anyone else's view.
export async function POST(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const [session] = await db.select().from(ventSessions).where(eq(ventSessions.id, parsed.data.sessionId)).limit(1);
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (session.venterId !== profile.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const [checkin] = await db
    .insert(moodCheckins)
    .values({
      userId: profile.id,
      sessionId: session.id,
      moodBefore: parsed.data.moodBefore,
      moodAfter: parsed.data.moodAfter,
    })
    .returning();

  return NextResponse.json({ checkin });
}
