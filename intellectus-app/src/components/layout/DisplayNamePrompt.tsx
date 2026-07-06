'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateDisplayName } from '@/lib/actions/profile';

const DISMISS_KEY = 'intellectus:display-name-prompt-dismissed';

export default function DisplayNamePrompt({ currentName }: { currentName: string }) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(true); // avoid a flash before we can check sessionStorage
  const [name, setName] = useState(currentName);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setDismissed(sessionStorage.getItem(DISMISS_KEY) === 'true');
  }, []);

  if (dismissed) return null;

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, 'true');
    setDismissed(true);
  }

  function save() {
    if (!name.trim()) return;
    startTransition(async () => {
      await updateDisplayName(name);
      dismiss();
      router.refresh();
    });
  }

  return (
    <div className="border-b border-[rgb(var(--nr-border))] bg-[rgb(var(--nr-bg-raised))]">
      <div className="max-w-3xl mx-auto px-6 py-3 flex flex-wrap items-center gap-3 text-sm">
        <span className="text-[rgb(var(--nr-ink-muted))]">Want a different display name?</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-md border border-[rgb(var(--nr-border))] bg-[rgb(var(--nr-bg))] px-2 py-1 text-sm"
        />
        <button
          onClick={save}
          disabled={isPending}
          className="text-xs font-medium px-3 py-1.5 rounded-md bg-[rgb(var(--nr-accent))] text-[rgb(var(--nr-accent-ink))]"
        >
          Save
        </button>
        <button onClick={dismiss} className="text-xs text-[rgb(var(--nr-ink-muted))] hover:text-[rgb(var(--nr-ink))]">
          Not now
        </button>
      </div>
    </div>
  );
}
