'use client';

import type { Category } from '@/types/confession';
import { CATEGORY_META } from '@/types/confession';

const ALL_CATEGORIES: Array<{ value: Category | 'all'; label: string }> = [
  { value: 'all',              label: '✨ All'             },
  { value: 'confession',       label: '🤫 Confessions'    },
  { value: 'question',         label: '❓ Questions'       },
  { value: 'unpopular_opinion', label: '🔥 Unpopular'     },
];

interface Props {
  active: Category | 'all';
  onChange: (c: Category | 'all') => void;
}

export default function CategoryFilter({ active, onChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {ALL_CATEGORIES.map((cat) => (
        <button
          key={cat.value}
          onClick={() => onChange(cat.value)}
          className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
          style={{
            background:  active === cat.value ? 'var(--color-accent)' : 'var(--color-surface-2)',
            color:       active === cat.value ? 'var(--color-accent-fg)' : 'var(--color-text-muted)',
            border:      `1px solid ${active === cat.value ? 'var(--color-accent)' : 'var(--color-border)'}`,
          }}
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
