import { db } from '@/lib/db/client';
import { users, moderationFlags, comments } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Below this reputation score, a user is auto-shadow-banned. Moderation is
// fully automated at launch (confirmed product decision) — there is no
// human review queue gating this action.
const AUTO_SHADOW_BAN_THRESHOLD = -20;

export async function maybeAutoShadowBan(userId: string, currentScore: number) {
  if (currentScore > AUTO_SHADOW_BAN_THRESHOLD) return;

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user || user.isShadowBanned) return;

  await applyShadowBan(userId, 'automated: reputation score below threshold');
}

export async function applyShadowBan(userId: string, reason: string) {
  await db.transaction(async (tx) => {
    await tx.update(users).set({ isShadowBanned: true }).where(eq(users.id, userId));

    // Retroactively flag the user's existing comments so the RLS policy
    // (comments_select_public) hides them from public Postgres Changes
    // subscribers immediately, not just future comments.
    await tx.update(comments).set({ isShadowBanned: true }).where(eq(comments.userId, userId));

    await tx.insert(moderationFlags).values({
      targetType: 'user',
      targetId: userId,
      reason,
      status: 'reviewed',
      actionTaken: 'shadow_ban',
    });
  });
}

export async function liftShadowBan(userId: string) {
  await db.transaction(async (tx) => {
    await tx.update(users).set({ isShadowBanned: false }).where(eq(users.id, userId));
    await tx.update(comments).set({ isShadowBanned: false }).where(eq(comments.userId, userId));
  });
}
