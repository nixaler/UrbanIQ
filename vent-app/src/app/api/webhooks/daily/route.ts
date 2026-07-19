import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { dailyRoomEvents, ventSessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';

interface DailyWebhookPayload {
  type: string;
  payload: { room?: { name?: string } } & Record<string, unknown>;
}

// Audit-only log of Daily events (participant-left, recording-ready, etc).
// Recording is off by default given content sensitivity, so recording-ready
// events aren't expected in practice yet — this just future-proofs the hook.
export async function POST(request: Request) {
  const body = (await request.json()) as DailyWebhookPayload;
  const roomName = body.payload?.room?.name;

  if (roomName) {
    const [session] = await db
      .select({ id: ventSessions.id })
      .from(ventSessions)
      .where(eq(ventSessions.dailyRoomName, roomName))
      .limit(1);

    if (session) {
      await db.insert(dailyRoomEvents).values({
        sessionId: session.id,
        eventType: body.type,
        payload: body.payload,
      });
    }
  }

  return NextResponse.json({ received: true });
}
