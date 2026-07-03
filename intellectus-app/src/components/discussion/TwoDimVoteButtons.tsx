'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { castVote } from '@/lib/actions/discussion';

interface TwoDimVoteButtonsProps {
  commentId: string;
  wellResearchedCount: number;
  agreeCount: number;
  viewerVotedWellResearched: boolean;
  viewerVotedAgree: boolean;
}

/**
 * Two-Dimensional Voting (#3): "Well Researched" and "I Agree" are rendered
 * as visibly separate controls, not a single upvote — the point is that a
 * reader can mark a counter-argument as thoughtful without endorsing it.
 */
export default function TwoDimVoteButtons({
  commentId,
  wellResearchedCount,
  agreeCount,
  viewerVotedWellResearched,
  viewerVotedAgree,
}: TwoDimVoteButtonsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [votedWellResearched, setVotedWellResearched] = useState(viewerVotedWellResearched);
  const [votedAgree, setVotedAgree] = useState(viewerVotedAgree);

  function vote(voteType: 'well_researched' | 'agree') {
    if (voteType === 'well_researched' && votedWellResearched) return;
    if (voteType === 'agree' && votedAgree) return;

    startTransition(async () => {
      await castVote({ commentId, voteType });
      if (voteType === 'well_researched') setVotedWellResearched(true);
      else setVotedAgree(true);
      router.refresh();
    });
  }

  return (
    <div className="flex gap-3 text-xs">
      <button
        disabled={isPending || votedWellResearched}
        onClick={() => vote('well_researched')}
        className={`px-2 py-1 rounded-md border transition-colors ${
          votedWellResearched
            ? 'border-[rgb(var(--nr-well-researched))] text-[rgb(var(--nr-well-researched))]'
            : 'border-[rgb(var(--nr-border))] text-[rgb(var(--nr-ink-muted))] hover:text-[rgb(var(--nr-well-researched))]'
        }`}
      >
        Well Researched · {wellResearchedCount}
      </button>
      <button
        disabled={isPending || votedAgree}
        onClick={() => vote('agree')}
        className={`px-2 py-1 rounded-md border transition-colors ${
          votedAgree
            ? 'border-[rgb(var(--nr-agree))] text-[rgb(var(--nr-agree))]'
            : 'border-[rgb(var(--nr-border))] text-[rgb(var(--nr-ink-muted))] hover:text-[rgb(var(--nr-agree))]'
        }`}
      >
        I Agree · {agreeCount}
      </button>
    </div>
  );
}
