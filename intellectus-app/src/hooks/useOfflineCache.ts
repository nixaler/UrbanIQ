'use client';

import { useEffect } from 'react';
import { saveDailyStackToCache, loadDailyStackFromCache, type CachedDailyStack } from '@/lib/offline/dailyStackCache';

/**
 * Local-First Caching Framework (#30): the moment the app opens, silently
 * fetch the day's full stack and write it to IndexedDB — this is what lets
 * the reading UI keep working underground on a subway commute with zero
 * signal. Failures are swallowed on purpose: this is a background
 * nice-to-have, not something that should surface an error to the reader.
 */
export function useOfflineCache() {
  useEffect(() => {
    let cancelled = false;

    fetch('/api/offline/daily-stack')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: CachedDailyStack | null) => {
        if (!cancelled && data) return saveDailyStackToCache(data);
      })
      .catch(() => {
        // Offline or the request failed — the previously cached stack (if
        // any) remains valid and is what loadDailyStackFromCache() returns.
      });

    return () => {
      cancelled = true;
    };
  }, []);
}

export { loadDailyStackFromCache };
