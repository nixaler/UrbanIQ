'use server';

import { db } from '@/lib/db/client';
import { privacySettings, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireUser } from '@/lib/auth/guards';

// Zero-Data Tracking Mode (#27): the flag itself lives server-side (it has
// to, so updateReadingProgress can check it), but once enabled, per-session
// progress/streak data stops being written to Postgres — see the check in
// lib/actions/reading.ts. The client-local counterpart (writing progress to
// IndexedDB instead) is a Phase 6 item alongside the offline caching work;
// until that lands, zero-data users simply don't get persistent read-gate
// state across page loads, which is the correct fail-safe direction for a
// privacy-first tier (miss a convenience, not leak data).
export async function updatePrivacyMode(zeroDataMode: boolean) {
  const user = await requireUser();

  await db
    .insert(privacySettings)
    .values({ userId: user.id, zeroDataMode })
    .onConflictDoUpdate({
      target: privacySettings.userId,
      set: { zeroDataMode, updatedAt: new Date() },
    });

  await db.update(users).set({ privacyMode: zeroDataMode ? 'zero_data' : 'standard' }).where(eq(users.id, user.id));
}
