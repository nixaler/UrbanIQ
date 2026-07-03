import { NextResponse } from 'next/server';
import { inngest } from '@/lib/inngest/client';

// Triggered by Vercel Cron (weekly, e.g. Saturday 00:00 UTC). Only enqueues
// the event — dailyDigest.ts (Inngest) does the actual summarization work,
// keeping this route a thin trigger rather than duplicating logic.
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);

  await inngest.send({
    name: 'digest/weekly.requested',
    data: { weekStartDate: weekStart.toISOString().slice(0, 10) },
  });

  return NextResponse.json({ ok: true });
}
