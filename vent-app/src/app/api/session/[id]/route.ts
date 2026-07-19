import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { ventSessions } from '@/lib/db/schema';
import { getCurrentProfile } from '@/lib/auth/currentUser';

export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { id } = await params;
  const [session] = await db.select().from(ventSessions).where(eq(ventSessions.id, id)).limit(1);
  if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (session.venterId !== profile.id && session.listenerId !== profile.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ session });
}
