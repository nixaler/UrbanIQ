import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Service-role client for server-only privileged operations (e.g. Storage
// uploads for vent recordings/bottles). Never import this from client code.
let cachedAdmin: ReturnType<typeof createSupabaseClient> | null = null;

export function createAdminClient() {
  if (cachedAdmin) return cachedAdmin;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set');
  }

  cachedAdmin = createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cachedAdmin;
}
