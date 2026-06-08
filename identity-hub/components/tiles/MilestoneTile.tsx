'use client';

import type { MilestoneConfig } from '@/types/tile';

export default function MilestoneTile({ config }: { config: Record<string, unknown> }) {
  const { title, items } = config as MilestoneConfig;
  const done = items.filter((i) => i.done).length;
  const pct = items.length > 0 ? Math.round((done / items.length) * 100) : 0;

  return (
    <div className="tile-shell">
      <div className="tile-header">{title}</div>
      <div className="tile-body flex flex-col gap-3">
        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
            <span>{done} / {items.length} complete</span>
            <span>{pct}%</span>
          </div>
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ background: 'var(--color-border)' }}
          >
            <div
              className="h-full transition-all"
              style={{ width: `${pct}%`, background: 'var(--color-accent)' }}
            />
          </div>
        </div>

        {/* Item list */}
        <ul className="flex flex-col gap-1.5">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span
                className="mt-0.5 shrink-0 text-base"
                style={{ color: item.done ? 'var(--color-accent)' : 'var(--color-border)' }}
              >
                {item.done ? '✓' : '○'}
              </span>
              <span
                className={item.done ? 'line-through' : ''}
                style={{ color: item.done ? 'var(--color-text-muted)' : 'var(--color-text)' }}
              >
                {item.label}
              </span>
              <span className="ml-auto text-xs shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                {item.date}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
