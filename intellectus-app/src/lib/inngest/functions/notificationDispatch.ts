import { inngest } from '../client';
import { db } from '@/lib/db/client';
import { notificationsLog } from '@/lib/db/schema';

/**
 * Custom Notification Sequencing (#16): fires per-user, at that user's own
 * chosen "Intel Window" time, via `step.sleepUntil` — this is exactly what
 * a single global cron can't do, since it can't fan out to thousands of
 * distinct per-user send times without becoming its own scheduler.
 */
export const notificationDispatch = inngest.createFunction(
  { id: 'user-notification-dispatch' },
  { event: 'notifications/user.scheduled' },
  async ({ event, step }) => {
    const { userId, intelWindowTime, timezone } = event.data;

    const nextFireAt = computeNextOccurrence(intelWindowTime, timezone);
    await step.sleepUntil('wait-for-intel-window', nextFireAt);

    await step.run('send-notification', () =>
      db.insert(notificationsLog).values({
        userId,
        channel: 'push',
        payload: { kind: 'daily_stack_ready' },
      }),
    );

    return { userId, sentAt: nextFireAt.toISOString() };
  },
);

// Simplified to server-local time for Phase 0 scaffolding. Swap in a proper
// IANA timezone conversion (e.g. `luxon`'s `DateTime.fromObject` with
// `zone: timezone`) before this handles real users across timezones.
function computeNextOccurrence(timeOfDay: string, _timezone: string): Date {
  const [hoursStr, minutesStr] = timeOfDay.split(':');
  const next = new Date();
  next.setHours(Number(hoursStr ?? 7), Number(minutesStr ?? 45), 0, 0);
  if (next.getTime() <= Date.now()) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}
