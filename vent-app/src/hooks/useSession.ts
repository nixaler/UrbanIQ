'use client';

import { useQuery } from '@tanstack/react-query';
import { useSessionRealtime } from './useSessionRealtime';

export interface VentSessionDTO {
  id: string;
  topicId: string;
  venterId: string;
  listenerId: string | null;
  status: string;
  cameraMode: string;
  ventStartedAt: string | null;
  ventDurationSeconds: number;
  decision: string | null;
  extendRequestedBy: string | null;
  extendAccepted: boolean | null;
  dailyRoomUrl: string | null;
}

export function useSession(sessionId: string) {
  useSessionRealtime(sessionId);

  return useQuery({
    queryKey: ['session', sessionId],
    queryFn: async (): Promise<{ session: VentSessionDTO }> => {
      const res = await fetch(`/api/session/${sessionId}`);
      if (!res.ok) throw new Error('Failed to load session');
      return res.json();
    },
    // Realtime is the primary signal; this fallback interval just guards
    // against a missed/late websocket event.
    refetchInterval: 4000,
  });
}
