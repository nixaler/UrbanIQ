'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { TopicCard } from './TopicCard';
import { useMatchPolling } from '@/hooks/useMatchPolling';

interface Topic {
  id: string;
  name: string;
  description: string;
}

export function ListenerQueueForm({ topics }: { topics: Topic[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [queueEntryId, setQueueEntryId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data } = useMatchPolling(queueEntryId);
  const status = data?.queueEntry.status;

  async function startListening() {
    setError(null);
    try {
      const res = await fetch('/api/queue/enqueue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'listener', topicId: selectedId ?? undefined }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error === 'listener_academy_required' ? 'listener_academy_required' : 'failed');
      }
      const { queueEntry, match } = await res.json();
      if (match) {
        router.push(`/call/${match.sessionId}`);
        return;
      }
      setQueueEntryId(queueEntry.id);
    } catch (e) {
      setError(e instanceof Error && e.message === 'listener_academy_required'
        ? 'You need to complete the Listener Academy first.'
        : 'Something went wrong. Please try again.');
    }
  }

  async function stopListening() {
    if (!queueEntryId) return;
    await fetch('/api/queue/leave', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ queueEntryId }),
    });
    setQueueEntryId(null);
  }

  if (queueEntryId && status === 'waiting') {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto h-3 w-3 animate-pulse rounded-full bg-accent" />
        <p className="text-lg font-medium">Waiting for someone who needs to vent…</p>
        <button type="button" onClick={stopListening} className="text-sm text-ink-muted underline">
          Stop listening
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <TopicCard
          name="Any topic"
          description="Match me with whoever needs a listener soonest."
          selected={selectedId === null}
          onClick={() => setSelectedId(null)}
        />
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
        onClick={startListening}
        className="w-full rounded-md bg-accent py-3 font-medium text-white"
      >
        Start listening
      </button>
    </div>
  );
}
