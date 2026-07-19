import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { ventBottles, bottleReplies, karmaLedger, profiles } from '@/lib/db/schema';
import { getCurrentProfile } from '@/lib/auth/currentUser';
import { uploadAudio } from '@/lib/storage/uploadAudio';
import { featureFlags } from '@/lib/config/featureFlags';
import { updateGardenState } from '@/lib/karma/gardenState';
import { sql } from 'drizzle-orm';

export const runtime = 'nodejs';

const MAX_DURATION_SECONDS = 30;
const POINTS_BOTTLE_REPLY = 8;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  if (!profile.listenerCertifiedAt) {
    return NextResponse.json({ error: 'listener_academy_required' }, { status: 403 });
  }

  const { id } = await params;
  const [bottle] = await db
    .select()
    .from(ventBottles)
    .where(and(eq(ventBottles.id, id), eq(ventBottles.status, 'pending')))
    .limit(1);
  if (!bottle) return NextResponse.json({ error: 'Not found or already replied to' }, { status: 404 });

  const form = await request.formData();
  const audio = form.get('audio');
  const durationSeconds = Number(form.get('durationSeconds'));
  if (!(audio instanceof Blob) || !Number.isFinite(durationSeconds)) {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }
  if (durationSeconds > MAX_DURATION_SECONDS) {
    return NextResponse.json({ error: 'Reply too long' }, { status: 400 });
  }

  const audioUrl = await uploadAudio(`bottle-replies/${profile.id}/${Date.now()}.webm`, audio);

  const [reply] = await db
    .insert(bottleReplies)
    .values({ bottleId: id, listenerId: profile.id, audioUrl, durationSeconds: Math.round(durationSeconds) })
    .onConflictDoNothing()
    .returning();

  if (!reply) return NextResponse.json({ error: 'Someone else already replied' }, { status: 409 });

  await db.update(ventBottles).set({ status: 'replied' }).where(eq(ventBottles.id, id));

  if (featureFlags.karmaEnabled) {
    await db.insert(karmaLedger).values({
      userId: profile.id,
      points: POINTS_BOTTLE_REPLY,
      reasonCode: 'bottle_reply_sent',
    });
    await db
      .update(profiles)
      .set({ totalKarma: sql`${profiles.totalKarma} + ${POINTS_BOTTLE_REPLY}` })
      .where(eq(profiles.id, profile.id));
    await updateGardenState(profile.id, POINTS_BOTTLE_REPLY);
  }

  return NextResponse.json({ reply });
}
