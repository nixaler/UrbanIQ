import { createClient } from '@supabase/supabase-js';

// Server-only client — service role key, never sent to browser
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
  );
}
