import { NextResponse } from 'next/server';
import { and, eq, lt } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { ventBottles } from '@/lib/db/schema';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const result = await db
    .update(ventBottles)
    .set({ status: 'expired' })
    .where(and(eq(ventBottles.status, 'pending'), lt(ventBottles.expiresAt, new Date())))
    .returning({ id: ventBottles.id });

  return NextResponse.json({ expired: result.length });
}
