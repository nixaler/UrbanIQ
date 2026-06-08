'use client';

import type { Confession } from '@/types/confession';
import { CATEGORY_META } from '@/types/confession';
import ReactionBar from './ReactionBar';

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface Props {
  confession: Confession;
  isNew?: boolean;
}

export default function ConfessionCard({ confession, isNew }: Props) {
  const meta = CATEGORY_META[confession.category];

  return (
    <article className={`card ${isNew ? 'confession-enter' : ''}`}>
      {/* Category badge */}
      <div className="flex items-center justify-between mb-3">
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ background: meta.bg, color: meta.color }}
        >
          {meta.label}
        </span>
        <time className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {relativeTime(confession.created_at)}
        </time>
      </div>

      {/* Content */}
      <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text)' }}>
        {confession.content}
      </p>

      <ReactionBar confession={confession} />
    </article>
  );
}
