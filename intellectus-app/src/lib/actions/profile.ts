'use server';

import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireUser } from '@/lib/auth/guards';

export async function updateDisplayName(newName: string) {
  const user = await requireUser();
  const trimmed = newName.trim();
  if (!trimmed) throw new Error('Display name cannot be empty');

  await db.update(users).set({ displayName: trimmed, displayNameSet: true }).where(eq(users.id, user.id));
}
