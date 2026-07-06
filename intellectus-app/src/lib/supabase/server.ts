import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

type CookieToSet = { name: string; value: string; options: CookieOptions };

// Server-side Supabase client — used for Auth session reads and any
// Supabase Realtime broadcast/token minting from server code. Regular data
// reads/writes go through Drizzle (src/lib/db/client.ts); this client exists
// for what Drizzle can't do: auth, storage, and realtime channel auth.
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Called from a Server Component with no response to attach
            // cookies to — safe to ignore if middleware refreshes sessions.
          }
        },
      },
    },
  );
}

// Service-role client for privileged server-only operations (Inngest
// functions, admin routes). Never import this into client components.
export function createSupabaseServiceRoleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
