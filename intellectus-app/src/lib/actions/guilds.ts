'use server';

import { db } from '@/lib/db/client';
import { guilds, guildMembers, guildStreaks } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { requireUser } from '@/lib/auth/guards';

/**
 * Communal Streaks / Reading Guilds (#13). A guild's multiplier is owned by
 * streakReset.ts (Inngest, nightly) — these actions only manage membership.
 */
export async function createGuild(name: string) {
  const user = await requireUser();
  if (!name.trim()) throw new Error('Guild name is required');

  const [guild] = await db.insert(guilds).values({ name: name.trim(), createdBy: user.id }).returning();
  if (!guild) throw new Error('Failed to create guild');

  await db.insert(guildMembers).values({ guildId: guild.id, userId: user.id });
  await db.insert(guildStreaks).values({ guildId: guild.id, currentStreak: 0, multiplier: 1 });

  return guild;
}

export async function joinGuild(guildId: string) {
  const user = await requireUser();

  await db.insert(guildMembers).values({ guildId, userId: user.id }).onConflictDoNothing();
}

export async function leaveGuild(guildId: string) {
  const user = await requireUser();

  await db
    .delete(guildMembers)
    .where(and(eq(guildMembers.guildId, guildId), eq(guildMembers.userId, user.id)));
}
