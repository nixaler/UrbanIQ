import { db } from '@/lib/db/client';
import {
  discussionPrompts,
  comments,
  commentVotes,
  users,
  userBadges,
  badges,
  threadCloseRequests,
  readingProgress,
  subscriptions,
} from '@/lib/db/schema';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import ReadProgressGate from '@/components/reading/ReadProgressGate';
import DiscussionPromptCard from './DiscussionPromptCard';
import CommentComposer from './CommentComposer';
import CommentThread, { type SerializedComment } from './CommentThread';
import { PAYWALL_ENABLED } from '@/lib/config/featureFlags';

export default async function DiscussionSection({
  articleId,
  viewerId,
}: {
  articleId: string;
  viewerId: string | null;
}) {
  const [prompts, rawComments, initialProgress] = await Promise.all([
    db.select().from(discussionPrompts).where(eq(discussionPrompts.articleId, articleId)),
    db
      .select({
        id: comments.id,
        parentCommentId: comments.parentCommentId,
        body: comments.body,
        isAnonymous: comments.isAnonymous,
        isShadowBanned: comments.isShadowBanned,
        threadStatus: comments.threadStatus,
        createdAt: comments.createdAt,
        userId: comments.userId,
        authorName: users.displayName,
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .where(
        // RLS enforces this in Postgres; mirror it here so a signed-out
        // render (no viewerId) still never shows shadow-banned content.
        viewerId
          ? eq(comments.articleId, articleId)
          : and(eq(comments.articleId, articleId), eq(comments.isShadowBanned, false)),
      ),
    viewerId
      ? db
          .select({ unlockedComments: readingProgress.unlockedComments })
          .from(readingProgress)
          .where(and(eq(readingProgress.userId, viewerId), eq(readingProgress.articleId, articleId)))
          .limit(1)
          .then((rows) => rows[0]?.unlockedComments ?? false)
      : Promise.resolve(false),
  ]);

  const commentIds = rawComments.map((c) => c.id);
  const authorIds = [...new Set(rawComments.map((c) => c.userId))];

  const [voteRows, badgeRows, closeRequestRows] = commentIds.length
    ? await Promise.all([
        db
          .select({ commentId: commentVotes.commentId, voteType: commentVotes.voteType, userId: commentVotes.userId })
          .from(commentVotes)
          .where(inArray(commentVotes.commentId, commentIds)),
        db
          .select({ userId: userBadges.userId, label: badges.label })
          .from(userBadges)
          .innerJoin(badges, eq(userBadges.badgeId, badges.id))
          .where(inArray(userBadges.userId, authorIds)),
        db
          .select()
          .from(threadCloseRequests)
          .where(and(inArray(threadCloseRequests.commentId, commentIds), isNull(threadCloseRequests.confirmedBy))),
      ])
    : [[], [], []];

  const badgesByUser = new Map<string, string[]>();
  for (const row of badgeRows) {
    badgesByUser.set(row.userId, [...(badgesByUser.get(row.userId) ?? []), row.label]);
  }

  const pendingCloseByComment = new Map(closeRequestRows.map((r) => [r.commentId, { id: r.id, requestedBy: r.requestedBy }]));

  const serialized = new Map<string, SerializedComment>();
  for (const c of rawComments) {
    // A shadow-banned author still sees their own comment normally — the
    // ban is invisible to them (see reputationEngine/shadowBan.ts).
    if (c.isShadowBanned && c.userId !== viewerId) continue;

    const votesForComment = voteRows.filter((v) => v.commentId === c.id);
    serialized.set(c.id, {
      id: c.id,
      parentCommentId: c.parentCommentId,
      body: c.body,
      isAnonymous: c.isAnonymous,
      threadStatus: c.threadStatus,
      createdAt: c.createdAt.toISOString(),
      authorName: c.isAnonymous ? 'Devil\'s Advocate (anonymous)' : c.authorName,
      authorBadges: c.isAnonymous ? [] : badgesByUser.get(c.userId) ?? [],
      wellResearchedCount: votesForComment.filter((v) => v.voteType === 'well_researched').length,
      agreeCount: votesForComment.filter((v) => v.voteType === 'agree').length,
      viewerVotedWellResearched: viewerId
        ? votesForComment.some((v) => v.voteType === 'well_researched' && v.userId === viewerId)
        : false,
      viewerVotedAgree: viewerId ? votesForComment.some((v) => v.voteType === 'agree' && v.userId === viewerId) : false,
      pendingCloseRequest: pendingCloseByComment.get(c.id) ?? null,
      replies: [],
    });
  }

  const topLevel: SerializedComment[] = [];
  for (const comment of serialized.values()) {
    if (comment.parentCommentId && serialized.has(comment.parentCommentId)) {
      serialized.get(comment.parentCommentId)!.replies.push(comment);
    } else if (!comment.parentCommentId) {
      topLevel.push(comment);
    }
  }

  // Premium Ad-Free Discussion Rooms (#22): reading is always free; this
  // flag-gated check only affects the interactive discussion surface below,
  // and defaults off per the "free at launch" decision.
  let hasActiveSubscription = true;
  if (PAYWALL_ENABLED) {
    hasActiveSubscription = false;
    if (viewerId) {
      const [sub] = await db
        .select()
        .from(subscriptions)
        .where(and(eq(subscriptions.userId, viewerId), eq(subscriptions.status, 'active')))
        .limit(1);
      hasActiveSubscription = Boolean(sub);
    }
  }

  return (
    <section className="space-y-6 pt-4 border-t border-[rgb(var(--nr-border))]">
      <h2 className="text-xs uppercase tracking-widest text-[rgb(var(--nr-ink-muted))] font-semibold">Discussion</h2>

      {prompts.map((p) => (
        <DiscussionPromptCard key={p.id} promptText={p.promptText} />
      ))}

      {!hasActiveSubscription ? (
        <p className="text-sm text-[rgb(var(--nr-ink-muted))] p-6 rounded-xl border border-dashed border-[rgb(var(--nr-border))] text-center">
          Subscribe to join the discussion — reading stays free either way.
        </p>
      ) : (
        <ReadProgressGate articleId={articleId} viewerId={viewerId} initialUnlocked={initialProgress}>
          <div className="space-y-6">
            <CommentComposer articleId={articleId} />

            <div className="space-y-1">
              {topLevel.map((comment) => (
                <CommentThread key={comment.id} comment={comment} articleId={articleId} viewerId={viewerId ?? ''} />
              ))}
            </div>
          </div>
        </ReadProgressGate>
      )}
    </section>
  );
}
