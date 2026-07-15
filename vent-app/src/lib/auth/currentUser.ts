import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db/client';
import { profiles } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { generatePseudonym } from './pseudonym';

// Returns the current Supabase auth user (anonymous or upgraded) plus their
// `profiles` row, creating the profile row on first sight. Every route/page
// that touches session state should go through this rather than reading
// auth.users directly, since profiles carries the app-specific fields
// (pseudonym, karma, consent, etc).
export async function getCurrentProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [existing] = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);
  if (existing) return existing;

  const [created] = await db
    .insert(profiles)
    .values({
      id: user.id,
      pseudonym: generatePseudonym(),
      isAnonymous: user.is_anonymous ?? true,
      email: user.email ?? null,
    })
    .onConflictDoNothing()
    .returning();

  if (created) return created;

  // Lost a race with a concurrent request creating the same row — read it back.
  const [row] = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);
  return row ?? null;
}

export const CURRENT_TOS_VERSION = '2026-07-15';
