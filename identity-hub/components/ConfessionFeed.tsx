'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Confession, Category } from '@/types/confession';
import ConfessionCard from './ConfessionCard';

interface Props {
  initialData: Confession[];
  category: Category | 'all';
}

export default function ConfessionFeed({ initialData, category }: Props) {
  const [confessions, setConfessions] = useState<Confession[]>(initialData);
  const [loading, setLoading]         = useState(false);
  const newIds = useRef<Set<string>>(new Set());

  // Re-fetch when category filter changes
  useEffect(() => {
    setLoading(true);
    const params = category !== 'all' ? `?category=${category}` : '';
    fetch(`/api/confessions${params}`)
      .then((r) => r.json())
      .then((data: { confessions: Confession[] }) => setConfessions(data.confessions ?? []))
      .finally(() => setLoading(false));
  }, [category]);

  // Real-time: prepend new rows as they arrive
  useEffect(() => {
    const channel = supabase
      .channel('confessions-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'confessions' },
        (payload) => {
          const row = payload.new as Confession;
          if (category !== 'all' && row.category !== category) return;
          newIds.current.add(row.id);
          setConfessions((prev) => [row, ...prev]);
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [category]);

  if (loading) {
    return (
      <div className="flex justify-center py-16" style={{ color: 'var(--color-text-muted)' }}>
        Loading…
      </div>
    );
  }

  if (confessions.length === 0) {
    return (
      <div className="text-center py-16" style={{ color: 'var(--color-text-muted)' }}>
        <p className="text-4xl mb-3">🤫</p>
        <p>No confessions yet. Be the first.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {confessions.map((c) => (
        <ConfessionCard
          key={c.id}
          confession={c}
          isNew={newIds.current.has(c.id)}
        />
      ))}
    </div>
  );
}
