'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { requestThreadClose, confirmThreadClose } from '@/lib/actions/discussion';

interface AgreeToDisagreeButtonProps {
  commentId: string;
  threadStatus: 'open' | 'agree_to_disagree_closed';
  viewerId: string;
  pendingCloseRequest: { id: string; requestedBy: string } | null;
}

/**
 * Threaded "Agree to Disagree" Closures (#7): requires mutual consent — one
 * participant requests, the other confirms. Neither side can unilaterally
 * shut the other up.
 */
export default function AgreeToDisagreeButton({
  commentId,
  threadStatus,
  viewerId,
  pendingCloseRequest,
}: AgreeToDisagreeButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (threadStatus === 'agree_to_disagree_closed') {
    return <p className="text-xs text-[rgb(var(--nr-ink-muted))] italic">Closed by mutual agreement.</p>;
  }

  if (pendingCloseRequest) {
    if (pendingCloseRequest.requestedBy === viewerId) {
      return <p className="text-xs text-[rgb(var(--nr-ink-muted))] italic">Waiting for the other side to confirm…</p>;
    }
    return (
      <button
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await confirmThreadClose(pendingCloseRequest.id);
            router.refresh();
          })
        }
        className="text-xs text-[rgb(var(--nr-accent))] underline underline-offset-2"
      >
        Confirm agree to disagree
      </button>
    );
  }

  return (
    <button
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await requestThreadClose(commentId);
          router.refresh();
        })
      }
      className="text-xs text-[rgb(var(--nr-ink-muted))] underline underline-offset-2 hover:text-[rgb(var(--nr-ink))]"
    >
      Agree to disagree
    </button>
  );
}
