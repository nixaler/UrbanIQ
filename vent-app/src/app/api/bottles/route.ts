import { NextResponse } from 'next/server';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { ventBottles, topics } from '@/lib/db/schema';
import { getCurrentProfile } from '@/lib/auth/currentUser';
import { uploadAudio } from '@/lib/storage/uploadAudio';

export const runtime = 'nodejs';

const EXPIRY_HOURS = 48;
const MAX_DURATION_SECONDS = 60;

export async function POST(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (!profile.tosAcceptedAt) return NextResponse.json({ error: 'Consent required' }, { status: 403 });

  const form = await request.formData();
  const audio = form.get('audio');
  const topicId = form.get('topicId');
  const durationSeconds = Number(form.get('durationSeconds'));

  if (!(audio instanceof Blob) || typeof topicId !== 'string' || !Number.isFinite(durationSeconds)) {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }
  if (durationSeconds > MAX_DURATION_SECONDS) {
    return NextResponse.json({ error: 'Recording too long' }, { status: 400 });
  }

  const audioUrl = await uploadAudio(`bottles/${profile.id}/${Date.now()}.webm`, audio);

  const [bottle] = await db
    .insert(ventBottles)
    .values({
      venterId: profile.id,
      topicId,
      audioUrl,
      durationSeconds: Math.round(durationSeconds),
      expiresAt: new Date(Date.now() + EXPIRY_HOURS * 60 * 60 * 1000),
    })
    .returning();

  return NextResponse.json({ bottle });
}

const querySchema = z.object({ topicId: z.string().uuid().optional() });

export async function GET(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({ topicId: searchParams.get('topicId') ?? undefined });
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const conditions = [eq(ventBottles.status, 'pending')];
  if (parsed.data.topicId) conditions.push(eq(ventBottles.topicId, parsed.data.topicId));

  const pending = await db
    .select({ bottle: ventBottles, topicName: topics.name })
    .from(ventBottles)
    .innerJoin(topics, eq(topics.id, ventBottles.topicId))
    .where(and(...conditions));

  return NextResponse.json({ bottles: pending });
}
