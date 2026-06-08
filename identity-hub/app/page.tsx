'use client';

import { useState } from 'react';
import type { Category, Confession } from '@/types/confession';
import CategoryFilter from '@/components/CategoryFilter';
import ConfessionFeed from '@/components/ConfessionFeed';
import SubmitDrawer from '@/components/SubmitDrawer';
import ThemeToggle from '@/components/ThemeToggle';

// Seed mock data so the UI renders even before Supabase is connected
const MOCK: Confession[] = [
  {
    id: 'mock-1',
    content: 'I have absolutely no idea what I\'m doing at work but everyone thinks I\'m a senior engineer.',
    category: 'confession',
    created_at: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
    reactions: { '❤️': 42, '😂': 17, '😮': 8, '🔥': 5, '💀': 3 },
  },
  {
    id: 'mock-2',
    content: 'Does anyone else feel more productive at 2am than at 2pm, or is that just me?',
    category: 'question',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    reactions: { '❤️': 91, '😂': 4, '😮': 2, '🔥': 11, '💀': 0 },
  },
  {
    id: 'mock-3',
    content: 'Tabs are objectively better than spaces and I will die on this hill.',
    category: 'unpopular_opinion',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    reactions: { '❤️': 6, '😂': 33, '😮': 7, '🔥': 19, '💀': 12 },
  },
  {
    id: 'mock-4',
    content: 'I still read error messages I already know the answer to just so I look busy.',
    category: 'confession',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 11).toISOString(),
    reactions: { '❤️': 78, '😂': 55, '😮': 3, '🔥': 9, '💀': 2 },
  },
];

export default function Home() {
  const [category, setCategory]   = useState<Category | 'all'>('all');
  const [drawerOpen, setDrawer]   = useState(false);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-4 py-3"
        style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}
      >
        <div>
          <h1 className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>Confess</h1>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>anonymous · no accounts</p>
        </div>
        <ThemeToggle />
      </header>

      {/* Feed */}
      <main className="max-w-xl mx-auto px-4 py-4 pb-28">
        <div className="mb-4">
          <CategoryFilter active={category} onChange={setCategory} />
        </div>
        <ConfessionFeed initialData={MOCK} category={category} />
      </main>

      {/* FAB */}
      <button
        onClick={() => setDrawer(true)}
        className="fixed bottom-6 right-6 z-30 w-14 h-14 rounded-full text-xl font-bold shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
        style={{ background: 'var(--color-accent)', color: 'var(--color-accent-fg)' }}
        title="Post anonymously"
      >
        +
      </button>

      {/* Submit Drawer */}
      {drawerOpen && <SubmitDrawer onClose={() => setDrawer(false)} />}
    </div>
  );
}
