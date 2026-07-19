import { NextResponse } from 'next/server';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { issueFollows, issues, topics } from '@/lib/db/schema';
import { getCurrentProfile } from '@/lib/auth/currentUser';

export const runtime = 'nodejs';

const bodySchema = z.object({ issueId: z.string().uuid() });

export async function POST(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await db
    .insert(issueFollows)
    .values({ userId: profile.id, issueId: parsed.data.issueId })
    .onConflictDoNothing();

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  await db
    .delete(issueFollows)
    .where(and(eq(issueFollows.userId, profile.id), eq(issueFollows.issueId, parsed.data.issueId)));

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const followed = await db
    .select({ issue: issues, topicName: topics.name })
    .from(issueFollows)
    .innerJoin(issues, eq(issues.id, issueFollows.issueId))
    .innerJoin(topics, eq(topics.id, issues.topicId))
    .where(eq(issueFollows.userId, profile.id));

  return NextResponse.json({ followed });
}
