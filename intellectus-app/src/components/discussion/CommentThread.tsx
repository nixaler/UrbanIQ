'use client';

import { useState } from 'react';
import BadgeChip from '@/components/badges/BadgeChip';
import TwoDimVoteButtons from './TwoDimVoteButtons';
import AgreeToDisagreeButton from './AgreeToDisagreeButton';
import CommentComposer from './CommentComposer';

export interface SerializedComment {
  id: string;
  parentCommentId: string | null;
  body: string;
  isAnonymous: boolean;
  threadStatus: 'open' | 'agree_to_disagree_closed';
  createdAt: string;
  authorName: string;
  authorBadges: string[];
  wellResearchedCount: number;
  agreeCount: number;
  viewerVotedWellResearched: boolean;
  viewerVotedAgree: boolean;
  pendingCloseRequest: { id: string; requestedBy: string } | null;
  replies: SerializedComment[];
}

interface CommentThreadProps {
  comment: SerializedComment;
  articleId: string;
  viewerId: string;
  depth?: number;
}

export default function CommentThread({ comment, articleId, viewerId, depth = 0 }: CommentThreadProps) {
  const [replying, setReplying] = useState(false);

  return (
    <div className={depth > 0 ? 'pl-5 border-l border-[rgb(var(--nr-border))]' : ''}>
      <div className="py-3 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{comment.authorName}</span>
          {comment.authorBadges.map((label) => (
            <BadgeChip key={label} label={label} />
          ))}
        </div>

        <p className="text-sm leading-relaxed font-serif">{comment.body}</p>

        <div className="flex items-center gap-4">
          <TwoDimVoteButtons
            commentId={comment.id}
            wellResearchedCount={comment.wellResearchedCount}
            agreeCount={comment.agreeCount}
            viewerVotedWellResearched={comment.viewerVotedWellResearched}
            viewerVotedAgree={comment.viewerVotedAgree}
          />
          {comment.threadStatus !== 'agree_to_disagree_closed' && (
            <button
              onClick={() => setReplying((v) => !v)}
              className="text-xs text-[rgb(var(--nr-ink-muted))] hover:text-[rgb(var(--nr-ink))]"
            >
              Reply
            </button>
          )}
          {comment.parentCommentId && (
            <AgreeToDisagreeButton
              commentId={comment.id}
              threadStatus={comment.threadStatus}
              viewerId={viewerId}
              pendingCloseRequest={comment.pendingCloseRequest}
            />
          )}
        </div>

        {replying && (
          <div className="pt-2">
            <CommentComposer
              articleId={articleId}
              parentCommentId={comment.id}
              onPosted={() => setReplying(false)}
            />
          </div>
        )}
      </div>

      {comment.replies.map((reply) => (
        <CommentThread key={reply.id} comment={reply} articleId={articleId} viewerId={viewerId} depth={depth + 1} />
      ))}
    </div>
  );
}
