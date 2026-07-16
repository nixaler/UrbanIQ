'use client';

import { useTransition } from 'react';
import type { contentPosts } from '@/lib/db/schema';
import { updatePostStatusAction, deletePostAction } from '@/lib/actions/social';
import StatusBadge from './StatusBadge';

type Post = typeof contentPosts.$inferSelect;
const STATUSES = ['draft', 'scheduled', 'posted'] as const;

export default function PostCalendar({ posts }: { posts: Post[] }) {
  const [isPending, startTransition] = useTransition();

  if (posts.length === 0) {
    return <p className="text-sm text-ink-muted">No posts yet — plan your first one above.</p>;
  }

  return (
    <div className="space-y-3">
      {posts.map((p) => (
        <div key={p.id} className="rounded-lg border border-border bg-bg-raised p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">{p.platform}</span>
              <StatusBadge status={p.status} />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-ink-muted">
                {p.scheduledAt ? new Date(p.scheduledAt).toLocaleString() : 'Unscheduled'}
              </span>
              <select
                aria-label="Change status"
                value={p.status}
                disabled={isPending}
                onChange={(e) =>
                  startTransition(() => {
                    updatePostStatusAction(p.id, e.target.value as (typeof STATUSES)[number]);
                  })
                }
                className="rounded-md border border-border bg-bg px-1.5 py-0.5"
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button
                onClick={() => startTransition(() => deletePostAction(p.id))}
                className="text-ink-muted hover:text-red-500"
              >
                Remove
              </button>
            </div>
          </div>
          <p className="mt-2 text-sm">{p.caption}</p>
        </div>
      ))}
    </div>
  );
}
