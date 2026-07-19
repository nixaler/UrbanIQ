import { NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { reports, userSanctions, profiles } from '@/lib/db/schema';
import { getCurrentProfile } from '@/lib/auth/currentUser';

export const runtime = 'nodejs';

const bodySchema = z.object({
  action: z.enum(['dismiss', 'warn', 'temp_suspend', 'permanent_ban']),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const profile = await getCurrentProfile();
  const adminIds = (process.env.ADMIN_USER_IDS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!profile || !adminIds.includes(profile.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const [report] = await db.select().from(reports).where(eq(reports.id, id)).limit(1);
  if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  if (parsed.data.action === 'dismiss') {
    await db
      .update(reports)
      .set({ status: 'dismissed', reviewedBy: profile.id, reviewedAt: new Date() })
      .where(eq(reports.id, id));
    return NextResponse.json({ ok: true });
  }

  const action = parsed.data.action;
  const sanctionType = action === 'warn' ? ('warning' as const) : action;
  const expiresAt = sanctionType === 'temp_suspend' ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null;

  await db.insert(userSanctions).values({
    userId: report.reportedUserId,
    type: sanctionType,
    reason: `Report ${report.id} (${report.reasonCode})`,
    relatedReportId: report.id,
    expiresAt,
    issuedBy: profile.id,
  });

  if (action !== 'warn') {
    await db
      .update(profiles)
      .set({ status: action === 'permanent_ban' ? 'banned' : 'suspended' })
      .where(eq(profiles.id, report.reportedUserId));
  }

  await db
    .update(reports)
    .set({ status: 'actioned', reviewedBy: profile.id, reviewedAt: new Date() })
    .where(eq(reports.id, id));

  return NextResponse.json({ ok: true });
}
