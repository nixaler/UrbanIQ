'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

// Ensures every visitor has at least an anonymous Supabase session, since the
// core loop (queue, vent, listen) requires a stable user id. Runs once per
// mount; safe to call from any client component that needs to guarantee auth.
export function useEnsureAnonymousAuth() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function ensure() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        const { error } = await supabase.auth.signInAnonymously();
        if (error) {
          console.error('Anonymous sign-in failed', error);
        }
      }

      if (!cancelled) setReady(true);
    }

    ensure();
    return () => {
      cancelled = true;
    };
  }, []);

  return ready;
}
