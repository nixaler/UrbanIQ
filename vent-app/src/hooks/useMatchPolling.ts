'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface QueueEntry {
  id: string;
  status: 'waiting' | 'matched' | 'cancelled' | 'expired';
  sessionId: string | null;
}

const POLL_INTERVAL_MS = 2000;

// Pre-match waiting-room polling. Realtime (useSessionRealtime) is the fast
// path once a call is live; this covers pre-match discovery, where a few
// seconds of latency while "searching…" is shown is an acceptable tradeoff
// against standing up a dedicated WebSocket matchmaking server.
export function useMatchPolling(queueEntryId: string | null) {
  const router = useRouter();

  const query = useQuery({
    queryKey: ['queue-poll', queueEntryId],
    queryFn: async (): Promise<{ queueEntry: QueueEntry }> => {
      const res = await fetch('/api/queue/poll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queueEntryId }),
      });
      if (!res.ok) throw new Error('Poll failed');
      return res.json();
    },
    enabled: !!queueEntryId,
    refetchInterval: (query) => {
      const status = query.state.data?.queueEntry.status;
      return status === 'waiting' ? POLL_INTERVAL_MS : false;
    },
  });

  useEffect(() => {
    const entry = query.data?.queueEntry;
    if (entry?.status === 'matched' && entry.sessionId) {
      router.push(`/call/${entry.sessionId}`);
    }
  }, [query.data, router]);

  return query;
}
