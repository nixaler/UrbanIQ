'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { activateBubbleReset } from '@/lib/actions/feedReset';

export default function BubblePopButton({ alreadyActive }: { alreadyActive: boolean }) {
  const router = useRouter();
  const [active, setActive] = useState(alreadyActive);
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending || active}
      onClick={() =>
        startTransition(async () => {
          await activateBubbleReset();
          setActive(true);
          router.refresh();
        })
      }
      className="text-xs font-medium px-3 py-1.5 rounded-md border border-[rgb(var(--nr-border))] hover:border-[rgb(var(--nr-accent))] disabled:opacity-60"
    >
      {active ? 'Bubble popped — feed randomized for 48h' : 'Pop my bubble'}
    </button>
  );
}
