'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { postComment } from '@/lib/actions/discussion';
import DevilsAdvocateToggle from './DevilsAdvocateToggle';

interface CommentComposerProps {
  articleId: string;
  parentCommentId?: string;
  promptId?: string;
  onPosted?: () => void;
}

export default function CommentComposer({ articleId, parentCommentId, promptId, onPosted }: CommentComposerProps) {
  const router = useRouter();
  const [body, setBody] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (!body.trim()) return;
    setError(null);

    startTransition(async () => {
      try {
        await postComment({ articleId, parentCommentId, promptId, body, isAnonymous });
        setBody('');
        setIsAnonymous(false);
        onPosted?.();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to post comment');
      }
    });
  }

  return (
    <div className="space-y-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={parentCommentId ? 'Write a reply…' : 'Share a well-reasoned take…'}
        rows={parentCommentId ? 2 : 3}
        className="w-full rounded-lg border border-[rgb(var(--nr-border))] bg-[rgb(var(--nr-bg-raised))] p-3 text-sm resize-none focus:outline-none focus:border-[rgb(var(--nr-accent))]"
      />
      <div className="flex items-center justify-between">
        <DevilsAdvocateToggle checked={isAnonymous} onChange={setIsAnonymous} />
        <button
          onClick={submit}
          disabled={isPending || !body.trim()}
          className="text-xs font-medium px-3 py-1.5 rounded-md bg-[rgb(var(--nr-accent))] text-[rgb(var(--nr-accent-ink))] disabled:opacity-50"
        >
          {isPending ? 'Posting…' : 'Post'}
        </button>
      </div>
      {error && <p className="text-xs text-[rgb(var(--nr-agree))]">{error}</p>}
    </div>
  );
}
