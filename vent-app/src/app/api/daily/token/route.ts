import { NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { ventSessions } from '@/lib/db/schema';
import { getCurrentProfile } from '@/lib/auth/currentUser';
import { createMeetingToken } from '@/lib/daily/client';

export const runtime = 'nodejs';

const bodySchema = z.object({ sessionId: z.string().uuid() });

// The client calls this once it lands on /call/[sessionId] to get its own
// per-participant meeting token. DAILY_API_KEY never leaves the server.
export async function POST(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const [session] = await db
    .select()
    .from(ventSessions)
    .where(eq(ventSessions.id, parsed.data.sessionId))
    .limit(1);

  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (session.venterId !== profile.id && session.listenerId !== profile.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (!session.dailyRoomName || !session.dailyRoomExpiresAt) {
    return NextResponse.json({ error: 'Room not ready yet' }, { status: 409 });
  }

  const token = await createMeetingToken({
    roomName: session.dailyRoomName,
    userName: profile.pseudonym,
    expiresAt: session.dailyRoomExpiresAt,
  });

  return NextResponse.json({ token, roomUrl: session.dailyRoomUrl });
}
