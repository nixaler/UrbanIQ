'use client';

import { useEffect, useState } from 'react';

interface UseVentTimerOptions {
  ventStartedAt: string | null;
  ventDurationSeconds: number;
  onExpire?: () => void;
}

// Derives the countdown from the server-set `ventStartedAt` timestamp only —
// never from a client-side start time — so the 60s boundary can't drift from
// clock skew or be extended by tampering with one client's clock.
export function useVentTimer({ ventStartedAt, ventDurationSeconds, onExpire }: UseVentTimerOptions) {
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!ventStartedAt) {
      setSecondsRemaining(null);
      return;
    }

    const startedAtMs = new Date(ventStartedAt).getTime();

    function tick() {
      const elapsedSeconds = (Date.now() - startedAtMs) / 1000;
      const remaining = Math.max(0, Math.ceil(ventDurationSeconds - elapsedSeconds));
      setSecondsRemaining(remaining);
      if (remaining <= 0) {
        setExpired(true);
      }
    }

    tick();
    const interval = setInterval(tick, 250);
    return () => clearInterval(interval);
  }, [ventStartedAt, ventDurationSeconds]);

  useEffect(() => {
    if (expired) onExpire?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expired]);

  return { secondsRemaining, expired };
}
