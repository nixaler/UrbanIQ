import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { profiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentProfile, CURRENT_TOS_VERSION } from '@/lib/auth/currentUser';

export const runtime = 'nodejs';

export async function POST() {
  const profile = await getCurrentProfile();
  if (!profile) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  await db
    .update(profiles)
    .set({ tosAcceptedAt: new Date(), tosVersion: CURRENT_TOS_VERSION })
    .where(eq(profiles.id, profile.id));

  return NextResponse.json({ ok: true });
}
