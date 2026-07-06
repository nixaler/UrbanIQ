import { createSupabaseServerClient } from '@/lib/supabase/server';
import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function getSupabaseSession() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// Loads the app-level `users` profile row (reputation, role, streaks, etc.)
// for the currently authenticated Supabase Auth user, if any.
export async function getCurrentUserProfile() {
  const authUser = await getSupabaseSession();
  if (!authUser) return null;

  const rows = await db.select().from(users).where(eq(users.id, authUser.id)).limit(1);
  return rows[0] ?? null;
}
