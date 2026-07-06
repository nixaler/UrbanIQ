'use client';

import { useState, useTransition } from 'react';
import { updatePrivacyMode } from '@/lib/actions/privacy';

export default function PrivacyModeToggle({ initialZeroData }: { initialZeroData: boolean }) {
  const [zeroData, setZeroData] = useState(initialZeroData);
  const [isPending, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-3 text-sm cursor-pointer select-none">
      <input
        type="checkbox"
        checked={zeroData}
        disabled={isPending}
        onChange={(e) => {
          const next = e.target.checked;
          setZeroData(next);
          startTransition(() => updatePrivacyMode(next));
        }}
        className="accent-[rgb(var(--nr-accent))]"
      />
      <span>
        Zero-Data Tracking Mode
        <span className="block text-xs text-[rgb(var(--nr-ink-muted))]">
          Reading progress and streaks stop being stored on our servers.
        </span>
      </span>
    </label>
  );
}
