import { db } from '@/lib/db/client';
import { privacySettings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireUserForPage } from '@/lib/auth/guards';
import PrivacyModeToggle from '@/components/layout/PrivacyModeToggle';

export const dynamic = 'force-dynamic';

export default async function PrivacySettingsPage() {
  const user = await requireUserForPage('/settings/privacy');
  const [settings] = await db.select().from(privacySettings).where(eq(privacySettings.userId, user.id)).limit(1);

  return (
    <main className="min-h-screen bg-[rgb(var(--nr-bg))] text-[rgb(var(--nr-ink))]">
      <div className="max-w-lg mx-auto px-6 py-12 space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Privacy</h1>
        <PrivacyModeToggle initialZeroData={settings?.zeroDataMode ?? false} />
      </div>
    </main>
  );
}
