import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db/client';
import { ventSessions } from '@/lib/db/schema';
import { getCurrentProfile } from '@/lib/auth/currentUser';

export const runtime = 'nodejs';

const bodySchema = z.object({
  topicId: z.string().uuid(),
  cameraMode: z.enum(['off', 'on']).default('off'),
});

export async function POST(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (!profile.tosAcceptedAt) return NextResponse.json({ error: 'Consent required' }, { status: 403 });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const [session] = await db
    .insert(ventSessions)
    .values({
      topicId: parsed.data.topicId,
      venterId: profile.id,
      cameraMode: parsed.data.cameraMode,
    })
    .returning();

  return NextResponse.json({ session });
}
