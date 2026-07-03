'use client';

import { useEffect, useRef, useState } from 'react';
import { updateReadingProgress } from '@/lib/actions/reading';

/**
 * Drives the Read-to-Unlock Gate (#1). Tracks scroll position and elapsed
 * time locally, then reports both to the server every couple of seconds —
 * the server (not this hook) decides whether the thresholds are actually
 * met, since a modified client could otherwise fake `unlocked`.
 */
export function useReadingProgress(articleId: string, enabled: boolean, initialUnlocked: boolean) {
  const [unlocked, setUnlocked] = useState(initialUnlocked);
  const scrollPctRef = useRef(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    if (!enabled || unlocked) return;

    function onScroll() {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      scrollPctRef.current = scrollable > 0 ? Math.min(1, Math.max(0, doc.scrollTop / scrollable)) : 1;
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const interval = setInterval(async () => {
      const timeSpentSeconds = Math.round((Date.now() - startRef.current) / 1000);
      const result = await updateReadingProgress({
        articleId,
        scrollPct: scrollPctRef.current,
        timeSpentSeconds,
      });
      if (result.unlocked) setUnlocked(true);
    }, 3000);

    return () => {
      window.removeEventListener('scroll', onScroll);
      clearInterval(interval);
    };
  }, [articleId, enabled, unlocked]);

  return { unlocked };
}
