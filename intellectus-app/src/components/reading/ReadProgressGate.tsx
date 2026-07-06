'use client';

import { useReadingProgress } from '@/hooks/useReadingProgress';

interface ReadProgressGateProps {
  articleId: string;
  viewerId: string | null;
  initialUnlocked: boolean;
  children: React.ReactNode;
}

export default function ReadProgressGate({ articleId, viewerId, initialUnlocked, children }: ReadProgressGateProps) {
  const { unlocked } = useReadingProgress(articleId, Boolean(viewerId), initialUnlocked);

  if (!viewerId) {
    return (
      <p className="text-sm text-[rgb(var(--nr-ink-muted))] p-6 rounded-xl border border-dashed border-[rgb(var(--nr-border))] text-center">
        Sign in to join the discussion.
      </p>
    );
  }

  if (!unlocked) {
    return (
      <div className="p-6 rounded-xl border border-dashed border-[rgb(var(--nr-border))] text-center text-sm text-[rgb(var(--nr-ink-muted))]">
        Keep reading to unlock the discussion — comments open once you've made it through the piece.
      </div>
    );
  }

  return <>{children}</>;
}
