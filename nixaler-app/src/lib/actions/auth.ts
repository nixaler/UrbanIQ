'use server';

import { redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { db } from '@/lib/db/client';
import { users, llcFormations } from '@/lib/db/schema';

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/');
}

// A fresh Supabase Auth sign-up has no row in the app's `users` table yet.
// Called from the auth callback route right after the magic-link session is
// established, so every signed-in user has a profile (and a starter LLC
// formation record at `not_started`) before they ever hit the dashboard.
export async function ensureUserProfile() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  const existing = await db.select().from(users).where(eq(users.id, authUser.id)).limit(1);
  if (existing[0]) return existing[0];

  const displayName = authUser.email?.split('@')[0] ?? 'Founder';
  const [profile] = await db
    .insert(users)
    .values({
      id: authUser.id,
      email: authUser.email ?? '',
      displayName,
    })
    .returning();

  await db.insert(llcFormations).values({
    ownerId: authUser.id,
    businessName: `${displayName}'s business`,
  });

  return profile;
}
