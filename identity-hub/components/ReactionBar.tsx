'use client';

import { useState, useEffect } from 'react';
import { REACTIONS, type ReactionEmoji, type Confession } from '@/types/confession';

interface Props {
  confession: Confession;
}

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('confess-session');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('confess-session', id);
  }
  return id;
}

function getReacted(confessionId: string): Set<ReactionEmoji> {
  if (typeof window === 'undefined') return new Set();
  const raw = localStorage.getItem(`reacted:${confessionId}`);
  return raw ? new Set(JSON.parse(raw) as ReactionEmoji[]) : new Set();
}

function saveReacted(confessionId: string, emojis: Set<ReactionEmoji>) {
  localStorage.setItem(`reacted:${confessionId}`, JSON.stringify([...emojis]));
}

export default function ReactionBar({ confession }: Props) {
  const [counts, setCounts]   = useState(confession.reactions);
  const [reacted, setReacted] = useState<Set<ReactionEmoji>>(new Set());

  useEffect(() => {
    setReacted(getReacted(confession.id));
  }, [confession.id]);

  async function handleReact(emoji: ReactionEmoji) {
    if (reacted.has(emoji)) return; // already reacted

    // Optimistic update
    setCounts((prev) => ({ ...prev, [emoji]: (prev[emoji] ?? 0) + 1 }));
    const next = new Set(reacted);
    next.add(emoji);
    setReacted(next);
    saveReacted(confession.id, next);

    await fetch(`/api/confessions/${confession.id}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emoji, sessionId: getSessionId() }),
    });
  }

  return (
    <div className="flex flex-wrap gap-1.5 mt-3">
      {REACTIONS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => handleReact(emoji)}
          className={`reaction-btn ${reacted.has(emoji) ? 'reacted' : ''}`}
          title={reacted.has(emoji) ? 'Already reacted' : 'React'}
        >
          <span>{emoji}</span>
          <span>{counts[emoji] ?? 0}</span>
        </button>
      ))}
    </div>
  );
}
