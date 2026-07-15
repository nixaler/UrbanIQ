'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ReplyRecorder } from './ReplyRecorder';

interface BottleRow {
  bottle: {
    id: string;
    audioUrl: string;
    durationSeconds: number;
    createdAt: string;
  };
  topicName: string;
}

export function BottleInbox() {
  const [repliedIds, setRepliedIds] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);

  const { data, refetch } = useQuery({
    queryKey: ['bottles'],
    queryFn: async (): Promise<{ bottles: BottleRow[] }> => {
      const res = await fetch('/api/bottles');
      if (!res.ok) throw new Error('Failed to load bottles');
      return res.json();
    },
  });

  const bottles = (data?.bottles ?? []).filter((b) => !repliedIds.has(b.bottle.id));

  if (bottles.length === 0) {
    return <p className="text-ink-muted">No bottles waiting right now — check back later.</p>;
  }

  return (
    <div className="space-y-3">
      {bottles.map(({ bottle, topicName }) => (
        <div key={bottle.id} className="space-y-2 rounded-lg border border-border bg-bg-raised p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{topicName}</span>
            <span className="text-ink-muted">{bottle.durationSeconds}s</span>
          </div>
          <audio controls src={bottle.audioUrl} className="w-full" />
          {openId === bottle.id ? (
            <ReplyRecorder
              bottleId={bottle.id}
              onReplied={() => {
                setRepliedIds((prev) => new Set(prev).add(bottle.id));
                refetch();
              }}
            />
          ) : (
            <button
              type="button"
              onClick={() => setOpenId(bottle.id)}
              className="text-sm text-accent underline"
            >
              Reply to this
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
