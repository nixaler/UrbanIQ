'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { stakeOnPrediction } from '@/lib/actions/predictions';

export default function StakeForm({ predictionId }: { predictionId: string }) {
  const router = useRouter();
  const [amount, setAmount] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit(side: boolean) {
    setError(null);
    startTransition(async () => {
      try {
        await stakeOnPrediction({ predictionId, side, amount });
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to stake');
      }
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={1}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-24 rounded-md border border-[rgb(var(--nr-border))] bg-[rgb(var(--nr-bg))] px-2 py-1 text-sm"
        />
        <span className="text-xs text-[rgb(var(--nr-ink-muted))]">Knowledge Points</span>
      </div>
      <div className="flex gap-2">
        <button
          disabled={isPending}
          onClick={() => submit(true)}
          className="text-xs font-medium px-3 py-1.5 rounded-md bg-[rgb(var(--nr-well-researched))] text-[rgb(var(--nr-accent-ink))]"
        >
          Stake Yes
        </button>
        <button
          disabled={isPending}
          onClick={() => submit(false)}
          className="text-xs font-medium px-3 py-1.5 rounded-md bg-[rgb(var(--nr-agree))] text-[rgb(var(--nr-accent-ink))]"
        >
          Stake No
        </button>
      </div>
      {error && <p className="text-xs text-[rgb(var(--nr-agree))]">{error}</p>}
    </div>
  );
}
