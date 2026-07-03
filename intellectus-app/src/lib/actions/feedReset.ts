'use server';

import { db } from '@/lib/db/client';
import { feedResetEvents } from '@/lib/db/schema';
import { and, eq, gt } from 'drizzle-orm';
import { requireUser } from '@/lib/auth/guards';

const RESET_DURATION_HOURS = 48;

/**
 * Algorithmic Reset Toggle / "Pop My Bubble" (#25). The homepage has no
 * personalization ranking yet (it's a plain chronological feed), so this
 * writes the reset window now so the mechanism exists ahead of any future
 * topic-affinity ranking — a ranking query would check `isBubblePopped()`
 * and skip its personalization weighting while a reset is active.
 */
export async function activateBubbleReset() {
  const user = await requireUser();

  const expiresAt = new Date(Date.now() + RESET_DURATION_HOURS * 60 * 60 * 1000);
  const [event] = await db.insert(feedResetEvents).values({ userId: user.id, expiresAt }).returning();
  return event;
}

export async function isBubblePopped(userId: string): Promise<boolean> {
  const [active] = await db
    .select({ id: feedResetEvents.id })
    .from(feedResetEvents)
    .where(and(eq(feedResetEvents.userId, userId), gt(feedResetEvents.expiresAt, new Date())))
    .limit(1);
  return Boolean(active);
}
