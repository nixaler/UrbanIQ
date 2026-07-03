'use server';

import { db } from '@/lib/db/client';
import { comments, commentVotes, threadCloseRequests, readingProgress } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { requireUser } from '@/lib/auth/guards';
import { recordReputationEvent, checkDevilsAdvocateEligibility } from '@/lib/moderation/reputationEngine';

/**
 * Two-Dimensional Voting (#3): "Well Researched" and "I Agree" are
 * independent dimensions. Only "Well Researched" feeds the reputation
 * ledger — "I Agree" is tallied for display only, so agreement can't be
 * farmed for reputation or badges the way it can on a single-axis platform.
 */
export async function castVote(params: { commentId: string; voteType: 'well_researched' | 'agree' }) {
  const user = await requireUser();
  const { commentId, voteType } = params;

  const [comment] = await db.select({ userId: comments.userId }).from(comments).where(eq(comments.id, commentId)).limit(1);
  if (!comment) throw new Error('Comment not found');

  const inserted = await db
    .insert(commentVotes)
    .values({ commentId, userId: user.id, voteType })
    .onConflictDoNothing()
    .returning();

  if (inserted.length > 0 && voteType === 'well_researched' && comment.userId !== user.id) {
    await recordReputationEvent({
      userId: comment.userId,
      delta: 5,
      reason: 'vote_well_researched_received',
      relatedCommentId: commentId,
    });
  }

  return { voted: inserted.length > 0 };
}

/**
 * Posting requires the Read-to-Unlock Gate (#1) to already be unlocked for
 * this user+article — checked server-side against `reading_progress`, not
 * trusted from the client. Devil's Advocate posts (#5) still store the real
 * `userId` for moderation traceability; only display treats them as anonymous.
 */
export async function postComment(params: {
  articleId: string;
  promptId?: string;
  parentCommentId?: string;
  body: string;
  isAnonymous?: boolean;
}) {
  const user = await requireUser();
  const { articleId, promptId, parentCommentId, body, isAnonymous = false } = params;

  if (!body.trim()) throw new Error('Comment cannot be empty');

  const [progress] = await db
    .select({ unlockedComments: readingProgress.unlockedComments })
    .from(readingProgress)
    .where(and(eq(readingProgress.userId, user.id), eq(readingProgress.articleId, articleId)))
    .limit(1);

  if (!progress?.unlockedComments) {
    throw new Error('Finish reading the article before commenting');
  }

  if (isAnonymous) {
    const eligible = await checkDevilsAdvocateEligibility(user.id);
    if (!eligible) throw new Error("You've already used today's Devil's Advocate comment");
  }

  const [inserted] = await db
    .insert(comments)
    .values({ articleId, promptId, parentCommentId, userId: user.id, body, isAnonymous })
    .returning();

  return inserted;
}

async function getThreadParticipantIds(comment: typeof comments.$inferSelect): Promise<string[]> {
  if (!comment.parentCommentId) return [comment.userId];
  const [parent] = await db
    .select({ userId: comments.userId })
    .from(comments)
    .where(eq(comments.id, comment.parentCommentId))
    .limit(1);
  return parent ? [comment.userId, parent.userId] : [comment.userId];
}

/**
 * Agree-to-Disagree Closures (#7): mutual consent between the two
 * participants in a sub-thread. One requests, the OTHER participant must
 * confirm — the requester cannot confirm their own request.
 */
export async function requestThreadClose(commentId: string) {
  const user = await requireUser();
  const [comment] = await db.select().from(comments).where(eq(comments.id, commentId)).limit(1);
  if (!comment) throw new Error('Comment not found');

  const participantIds = await getThreadParticipantIds(comment);
  if (!participantIds.includes(user.id)) throw new Error('Not a participant in this thread');

  const [request] = await db
    .insert(threadCloseRequests)
    .values({ commentId, requestedBy: user.id })
    .returning();

  return request;
}

export async function confirmThreadClose(closeRequestId: string) {
  const user = await requireUser();

  const [request] = await db
    .select()
    .from(threadCloseRequests)
    .where(eq(threadCloseRequests.id, closeRequestId))
    .limit(1);
  if (!request) throw new Error('Close request not found');
  if (request.requestedBy === user.id) throw new Error('Cannot confirm your own close request');

  const [comment] = await db.select().from(comments).where(eq(comments.id, request.commentId)).limit(1);
  if (!comment) throw new Error('Comment not found');

  const participantIds = await getThreadParticipantIds(comment);
  if (!participantIds.includes(user.id)) throw new Error('Not a participant in this thread');

  await db.transaction(async (tx) => {
    await tx
      .update(threadCloseRequests)
      .set({ confirmedBy: user.id })
      .where(eq(threadCloseRequests.id, closeRequestId));
    await tx.update(comments).set({ threadStatus: 'agree_to_disagree_closed' }).where(eq(comments.id, comment.id));
  });
}
