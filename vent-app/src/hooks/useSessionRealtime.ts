'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';

// Fast path for in-call state changes (vent-start, extend request/response,
// end) — subscribes to Postgres Changes on this one session row and
// invalidates the React Query cache so useSessionPoll's next read reflects
// it immediately, instead of waiting for the next poll tick.
export function useSessionRealtime(sessionId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`vent_sessions:${sessionId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'vent_sessions', filter: `id=eq.${sessionId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, queryClient]);
}
