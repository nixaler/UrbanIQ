import { createClient } from '@supabase/supabase-js';

// Browser-safe client — uses anon key + RLS
// Fallback placeholders let the module load without crashing when env vars
// aren't set (e.g. local preview). Real-time + DB calls will fail silently.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL      ?? 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key',
);
