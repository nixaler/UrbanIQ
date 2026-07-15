'use client';

import { useQuery } from '@tanstack/react-query';

export function useDailyToken(sessionId: string, roomUrl: string | null) {
  return useQuery({
    queryKey: ['daily-token', sessionId],
    queryFn: async (): Promise<{ token: string; roomUrl: string }> => {
      const res = await fetch('/api/daily/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      if (!res.ok) throw new Error('Failed to get call token');
      return res.json();
    },
    enabled: !!roomUrl,
    staleTime: Infinity,
  });
}
