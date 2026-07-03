'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { reviewModerationFlag, overrideLiftShadowBan } from '@/lib/actions/moderation';

interface ModerationFlagRowProps {
  id: string;
  targetType: string;
  targetId: string;
  reason: string;
  status: string;
  actionTaken: string;
}

export default function ModerationFlagRow({ id, targetType, targetId, reason, status, actionTaken }: ModerationFlagRowProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <li className="p-3 rounded-lg border border-[rgb(var(--nr-border))] text-sm space-y-1">
      <div className="flex items-center justify-between">
        <span className="font-medium">
          {targetType} · {targetId.slice(0, 8)}
        </span>
        <span className="text-xs text-[rgb(var(--nr-ink-muted))]">{status}</span>
      </div>
      <p className="text-xs text-[rgb(var(--nr-ink-muted))]">{reason}</p>
      <p className="text-xs">Action taken: {actionTaken}</p>
      <div className="flex gap-3 pt-1">
        {status === 'open' && (
          <button
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await reviewModerationFlag({ flagId: id, status: 'reviewed' });
                router.refresh();
              })
            }
            className="text-xs text-[rgb(var(--nr-accent))] underline underline-offset-2"
          >
            Mark reviewed
          </button>
        )}
        {targetType === 'user' && actionTaken === 'shadow_ban' && (
          <button
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await overrideLiftShadowBan(targetId);
                router.refresh();
              })
            }
            className="text-xs text-[rgb(var(--nr-agree))] underline underline-offset-2"
          >
            Lift shadow ban
          </button>
        )}
      </div>
    </li>
  );
}
