import { NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { queueEntries } from '@/lib/db/schema';
import { getCurrentProfile } from '@/lib/auth/currentUser';
import { runMatchCycle } from '@/lib/matching/matcher';

export const runtime = 'nodejs';

const bodySchema = z.object({ queueEntryId: z.string().uuid() });

export async function POST(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const [entry] = await db
    .select()
    .from(queueEntries)
    .where(eq(queueEntries.id, parsed.data.queueEntryId))
    .limit(1);
  if (!entry || entry.userId !== profile.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Every poll also nudges the matcher forward — this is what lets a
  // listener who enqueues moments after a venter still get paired quickly
  // without a standalone matchmaking server.
  if (entry.status === 'waiting') {
    await runMatchCycle();
    const [refreshed] = await db.select().from(queueEntries).where(eq(queueEntries.id, entry.id)).limit(1);
    return NextResponse.json({ queueEntry: refreshed });
  }

  return NextResponse.json({ queueEntry: entry });
}
