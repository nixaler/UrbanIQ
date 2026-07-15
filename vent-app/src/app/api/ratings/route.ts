import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/client';
import { empathyRatings, ventSessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentProfile } from '@/lib/auth/currentUser';

export const runtime = 'nodejs';

const bodySchema = z.object({
  sessionId: z.string().uuid(),
  stars: z.number().int().min(1).max(5),
  tags: z.array(z.enum(['felt_heard', 'respectful', 'helpful'])).optional(),
});

// Rated by the Venter, about the Listener — never the other way around;
// there's no reciprocal "rate the venter" flow by design.
export async function POST(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const [session] = await db.select().from(ventSessions).where(eq(ventSessions.id, parsed.data.sessionId)).limit(1);
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (session.venterId !== profile.id || !session.listenerId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const [rating] = await db
    .insert(empathyRatings)
    .values({
      sessionId: session.id,
      raterId: profile.id,
      ratedUserId: session.listenerId,
      stars: parsed.data.stars,
      tags: parsed.data.tags,
    })
    .onConflictDoNothing()
    .returning();

  return NextResponse.json({ rating });
}
