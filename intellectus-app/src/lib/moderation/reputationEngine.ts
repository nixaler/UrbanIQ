import { db } from '@/lib/db/client';
import { reputationEvents, users, badges, userBadges, comments } from '@/lib/db/schema';
import { and, eq, gte, lte, sql } from 'drizzle-orm';
import { maybeAutoShadowBan } from './shadowBan';

export type ReputationReason =
  | 'vote_well_researched_received'
  | 'vote_agree_received'
  | 'comment_flagged'
  | 'comment_removed'
  | 'civility_bonus'
  | 'manual_adjustment';

/**
 * The single ledger behind two-dimensional voting (#3), badge computation
 * (#4), Devil's Advocate eligibility (#5), and shadow-banning (#26). Every
 * one of those features reads or writes through this function rather than
 * mutating `users.reputation_score` directly, so the score and its audit
 * trail can never drift apart.
 */
export async function recordReputationEvent(params: {
  userId: string;
  delta: number;
  reason: ReputationReason;
  relatedCommentId?: string;
}) {
  const { userId, delta, reason, relatedCommentId } = params;

  const updatedUser = await db.transaction(async (tx) => {
    await tx.insert(reputationEvents).values({
      userId,
      delta,
      reason,
      relatedCommentId,
    });

    const [row] = await tx
      .update(users)
      .set({ reputationScore: sql`${users.reputationScore} + ${delta}` })
      .where(eq(users.id, userId))
      .returning();

    return row;
  });

  if (!updatedUser) return null;

  await recomputeBadges(userId, updatedUser.reputationScore);

  // Moderation is fully automated at launch (confirmed product decision) —
  // no human-review queue gates a negative-reputation user from being
  // auto-shadow-banned once they cross the threshold.
  if (delta < 0) {
    await maybeAutoShadowBan(userId, updatedUser.reputationScore);
  }

  return updatedUser;
}

/**
 * Awards any badge whose `min_reputation_score` the user now qualifies for
 * and doesn't already hold. Reputable Contributor Badges (#4) are purely a
 * read of this same ledger's rolled-up score — no separate scoring logic.
 */
export async function recomputeBadges(userId: string, currentScore: number) {
  const eligibleBadges = await db
    .select()
    .from(badges)
    .where(lte(badges.minReputationScore, currentScore));
  if (eligibleBadges.length === 0) return;

  // Checked explicitly rather than relying on onConflictDoNothing: the
  // unique(userId, badgeId, topicId) constraint doesn't dedupe here because
  // Postgres treats every NULL topicId as distinct from every other NULL,
  // so two global (non-topic-scoped) awards of the same badge would both
  // insert successfully.
  const alreadyHeld = await db
    .select({ badgeId: userBadges.badgeId })
    .from(userBadges)
    .where(eq(userBadges.userId, userId));
  const alreadyHeldIds = new Set(alreadyHeld.map((row) => row.badgeId));

  const toAward = eligibleBadges.filter((badge) => !alreadyHeldIds.has(badge.id));
  if (toAward.length === 0) return;

  await db.insert(userBadges).values(toAward.map((badge) => ({ userId, badgeId: badge.id, topicId: null })));
}

/**
 * Devil's Advocate Mode (#5): one anonymous comment per user per UTC day.
 * Implemented as a direct query for now; move to an Upstash Redis counter
 * (`da:{userId}:{date}`) if comment-table scans become a hot path.
 */
export async function checkDevilsAdvocateEligibility(userId: string): Promise<boolean> {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);

  const existing = await db
    .select({ id: comments.id })
    .from(comments)
    .where(
      and(
        eq(comments.userId, userId),
        eq(comments.isAnonymous, true),
        gte(comments.createdAt, startOfDay),
      ),
    )
    .limit(1);

  return existing.length === 0;
}
