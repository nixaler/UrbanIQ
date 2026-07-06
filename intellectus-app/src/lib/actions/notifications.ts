'use server';

import { db } from '@/lib/db/client';
import { notificationPrefs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireUser } from '@/lib/auth/guards';
import { inngest } from '@/lib/inngest/client';

/**
 * Custom Notification Sequencing (#16): saving a preference immediately
 * (re-)enqueues the user's next scheduled send via Inngest's
 * `step.sleepUntil`, rather than waiting on a shared global cron tick.
 */
export async function updateNotificationPrefs(params: {
  intelWindowTime: string;
  timezone: string;
  push: boolean;
  email: boolean;
}) {
  const user = await requireUser();
  const { intelWindowTime, timezone, push, email } = params;

  await db
    .insert(notificationPrefs)
    .values({ userId: user.id, intelWindowTime, timezone, channels: { push, email } })
    .onConflictDoUpdate({
      target: notificationPrefs.userId,
      set: { intelWindowTime, timezone, channels: { push, email } },
    });

  await inngest.send({
    name: 'notifications/user.scheduled',
    data: { userId: user.id, intelWindowTime, timezone },
  });
}
