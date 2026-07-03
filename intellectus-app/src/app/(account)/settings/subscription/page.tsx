import { db } from '@/lib/db/client';
import { subscriptions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireUserForPage } from '@/lib/auth/guards';
import SubscribeButton from '@/components/layout/SubscribeButton';
import { PAYWALL_ENABLED } from '@/lib/config/featureFlags';

export const dynamic = 'force-dynamic';

export default async function SubscriptionSettingsPage() {
  const user = await requireUserForPage('/settings/subscription');
  const [sub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, user.id)).limit(1);

  return (
    <main className="min-h-screen bg-[rgb(var(--nr-bg))] text-[rgb(var(--nr-ink))]">
      <div className="max-w-lg mx-auto px-6 py-12 space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Subscription</h1>

        {!PAYWALL_ENABLED && (
          <p className="text-sm text-[rgb(var(--nr-ink-muted))]">
            Discussion rooms are free for everyone right now — subscriptions aren't required yet.
          </p>
        )}

        <p className="text-sm">
          Status: <span className="font-medium">{sub?.status ?? 'none'}</span> · Tier:{' '}
          <span className="font-medium">{sub?.tier ?? 'free'}</span>
        </p>

        {process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID && (!sub || sub.status !== 'active') && (
          <SubscribeButton priceId={process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID} />
        )}
      </div>
    </main>
  );
}
