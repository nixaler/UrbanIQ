import { db } from '@/lib/db/client';
import { notificationPrefs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireUserForPage } from '@/lib/auth/guards';
import NotificationPrefsForm from '@/components/layout/NotificationPrefsForm';

export const dynamic = 'force-dynamic';

export default async function NotificationSettingsPage() {
  const user = await requireUserForPage('/settings/notifications');

  const [prefs] = await db.select().from(notificationPrefs).where(eq(notificationPrefs.userId, user.id)).limit(1);

  return (
    <main className="min-h-screen bg-[rgb(var(--nr-bg))] text-[rgb(var(--nr-ink))]">
      <div className="max-w-lg mx-auto px-6 py-12 space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Notification settings</h1>
        <NotificationPrefsForm
          initialTime={prefs?.intelWindowTime ?? '07:45:00'}
          initialTimezone={prefs?.timezone ?? 'UTC'}
          initialPush={prefs?.channels?.push ?? true}
          initialEmail={prefs?.channels?.email ?? false}
        />
      </div>
    </main>
  );
}
