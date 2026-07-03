'use server';

import { db } from '@/lib/db/client';
import { moderationFlags } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireRole } from '@/lib/auth/guards';
import { liftShadowBan } from '@/lib/moderation/shadowBan';

// Moderation is fully automated at launch (confirmed product decision) —
// this is an audit/override surface for staff, not the primary line of
// defense against bad actors.
export async function reviewModerationFlag(params: { flagId: string; status: 'reviewed' | 'dismissed' }) {
  await requireRole('moderator');
  await db.update(moderationFlags).set({ status: params.status }).where(eq(moderationFlags.id, params.flagId));
}

export async function overrideLiftShadowBan(userId: string) {
  await requireRole('moderator');
  await liftShadowBan(userId);
}
