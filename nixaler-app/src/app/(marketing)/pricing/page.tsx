import PricingCard from '@/components/marketing/PricingCard';
import { getCurrentUserProfile } from '@/lib/auth/session';

export default async function PricingPage() {
  const profile = await getCurrentUserProfile();

  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">One plan. Everything included.</h1>
        <p className="mt-4 text-ink-muted">
          No tiers to compare, no add-ons to upsell you on later. LLC formation, your website,
          your CRM, your social media manager, and coaching — one price.
        </p>
      </div>
      <div className="mt-14">
        <PricingCard signedIn={Boolean(profile)} />
      </div>
    </section>
  );
}
