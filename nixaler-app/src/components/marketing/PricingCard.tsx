import Link from 'next/link';
import { PLAN } from '@/lib/config/plans';

export default function PricingCard({ signedIn }: { signedIn: boolean }) {
  return (
    <div className="mx-auto max-w-md rounded-lg border border-border bg-bg-raised p-8">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">{PLAN.name}</p>
      <p className="mt-4 flex items-baseline gap-1">
        <span className="text-5xl font-semibold tracking-tight">${PLAN.priceMonthly}</span>
        <span className="text-ink-muted">/mo</span>
      </p>
      <ul className="mt-8 space-y-3 text-sm">
        {PLAN.features.map((f) => (
          <li key={f} className="flex gap-2">
            <span className="text-accent">✓</span>
            <span className="text-ink-muted">{f}</span>
          </li>
        ))}
      </ul>
      <Link
        href={signedIn ? '/dashboard' : '/sign-in?redirect=/pricing'}
        className="mt-8 block rounded-full bg-accent px-6 py-3 text-center text-sm font-medium text-accent-ink hover:opacity-90 transition"
      >
        {signedIn ? 'Go to your dashboard' : 'Sign in to get started'}
      </Link>
      <p className="mt-3 text-center text-xs text-ink-muted">Month-to-month. Cancel anytime.</p>
    </div>
  );
}
