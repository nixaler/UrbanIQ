import { NextResponse } from 'next/server';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { queueEntries } from '@/lib/db/schema';
import { getCurrentProfile } from '@/lib/auth/currentUser';

export const runtime = 'nodejs';

const bodySchema = z.object({ queueEntryId: z.string().uuid() });

export async function DELETE(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await db
    .update(queueEntries)
    .set({ status: 'cancelled' })
    .where(
      and(
        eq(queueEntries.id, parsed.data.queueEntryId),
        eq(queueEntries.userId, profile.id),
        eq(queueEntries.status, 'waiting')
      )
    );

  return NextResponse.json({ ok: true });
}
