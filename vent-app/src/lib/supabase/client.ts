import { createBrowserClient } from '@supabase/ssr';

// Browser-side Supabase client. Signs users in anonymously on first load if
// they don't already have a session — see hooks/useSessionRealtime.ts and
// components/onboarding/ConsentGate.tsx for where that's triggered.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
