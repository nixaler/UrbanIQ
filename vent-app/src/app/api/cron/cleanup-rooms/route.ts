import { NextResponse } from 'next/server';
import { and, eq, lt } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { queueEntries } from '@/lib/db/schema';

export const runtime = 'nodejs';

// Queue entries waiting beyond this are expired — the UI response is the
// "Message in a Bottle" async fallback, not a dead-end "no listeners" screen.
const WAIT_TIMEOUT_SECONDS = 90;

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const cutoff = new Date(Date.now() - WAIT_TIMEOUT_SECONDS * 1000);
  const result = await db
    .update(queueEntries)
    .set({ status: 'expired' })
    .where(and(eq(queueEntries.status, 'waiting'), lt(queueEntries.enqueuedAt, cutoff)))
    .returning({ id: queueEntries.id });

  return NextResponse.json({ expired: result.length });
}
