'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TopicCard } from './TopicCard';

interface Topic {
  id: string;
  name: string;
  description: string;
}

export function TopicGrid({ topics }: { topics: Topic[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startVenting() {
    if (!selectedId) return;
    setStarting(true);
    setError(null);
    try {
      const sessionRes = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId: selectedId, cameraMode: 'off' }),
      });
      if (!sessionRes.ok) throw new Error('Failed to start');
      const { session } = await sessionRes.json();

      const queueRes = await fetch('/api/queue/enqueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'venter', sessionId: session.id }),
      });
      if (!queueRes.ok) throw new Error('Failed to join the queue');
      const { queueEntry, match } = await queueRes.json();

      if (match) {
        router.push(`/call/${match.sessionId}`);
      } else {
        router.push(`/vent/${session.id}?queueEntryId=${queueEntry.id}`);
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setStarting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {topics.map((topic) => (
          <TopicCard
            key={topic.id}
            name={topic.name}
            description={topic.description}
            selected={selectedId === topic.id}
            onClick={() => setSelectedId(topic.id)}
          />
        ))}
      </div>
      {error && <p className="text-sm text-critical">{error}</p>}
      <button
        type="button"
        disabled={!selectedId || starting}
        onClick={startVenting}
        className="w-full rounded-md bg-accent py-3 font-medium text-white disabled:opacity-50"
      >
        {starting ? 'Finding a listener…' : 'Start my 60-second vent'}
      </button>
    </div>
  );
}
