'use client';

import { useEffect, useState } from 'react';
import type { ThemeName } from '@/types/tile';

const THEMES: { value: ThemeName; label: string }[] = [
  { value: 'light',         label: '☀️ Light'   },
  { value: 'dark',          label: '🌙 Dark'    },
  { value: 'myspace-retro', label: '✨ Retro'   },
];

export default function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeName>('light');

  useEffect(() => {
    const saved = localStorage.getItem('ih-theme') as ThemeName | null;
    if (saved) applyTheme(saved);
  }, []);

  function applyTheme(t: ThemeName) {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('ih-theme', t);
    setTheme(t);
  }

  return (
    <div className="flex gap-1">
      {THEMES.map((t) => (
        <button
          key={t.value}
          onClick={() => applyTheme(t.value)}
          className="px-3 py-1 text-xs rounded transition-opacity"
          style={{
            background: theme === t.value ? 'var(--color-accent)' : 'var(--color-surface)',
            color:      theme === t.value ? 'var(--color-accent-fg)' : 'var(--color-text)',
            border:     '1px solid var(--color-border)',
            borderRadius: 'var(--tile-radius)',
            opacity:    theme === t.value ? 1 : 0.7,
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
