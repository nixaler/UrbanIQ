'use client';

import { useTransition } from 'react';
import { markModuleCompleteAction } from '@/lib/actions/coaching';

interface ModuleRow {
  id: string;
  title: string;
  description: string;
  resourceUrl: string | null;
  completed: boolean;
}

export default function ModuleList({ modules }: { modules: ModuleRow[] }) {
  const [isPending, startTransition] = useTransition();

  if (modules.length === 0) {
    return <p className="text-sm text-ink-muted">No curriculum modules yet — check back soon.</p>;
  }

  return (
    <div className="space-y-3">
      {modules.map((m) => (
        <div key={m.id} className="flex items-start justify-between gap-4 rounded-lg border border-border bg-bg-raised p-4">
          <div>
            <p className="font-medium">{m.title}</p>
            <p className="mt-1 text-sm text-ink-muted">{m.description}</p>
            {m.resourceUrl && (
              <a href={m.resourceUrl} className="mt-2 inline-block text-xs text-accent hover:underline">
                Open resource
              </a>
            )}
          </div>
          {m.completed ? (
            <span className="shrink-0 rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-600">
              Completed
            </span>
          ) : (
            <button
              disabled={isPending}
              onClick={() => startTransition(() => markModuleCompleteAction(m.id))}
              className="shrink-0 rounded-full border border-border px-3 py-1 text-xs font-medium hover:border-accent"
            >
              Mark complete
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
