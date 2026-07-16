import Link from 'next/link';
import { PLAN } from '@/lib/config/plans';

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 right-[-10%] h-[32rem] w-[32rem] rounded-full bg-accent/10 blur-3xl"
      />
      <div className="relative mx-auto max-w-6xl px-6 pt-24 pb-20 sm:pt-32">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
          Business, assembled
        </p>
        <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.1] tracking-tight sm:text-6xl">
          Come as a cook.
          <br />
          Leave as a founder.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-ink-muted">
          You already have the craft — the food, the product, the client list, the talent. niXaler
          builds everything around it: an LLC, tax-advantage guidance, a website, a CRM, and a
          social media manager, for one fixed price a month.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            href="/pricing"
            className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-ink hover:opacity-90 transition"
          >
            Start at ${PLAN.priceMonthly}/mo
          </Link>
          <Link
            href="#offer"
            className="rounded-full border border-border px-6 py-3 text-sm font-medium text-ink hover:border-ink transition"
          >
            See what&apos;s included
          </Link>
        </div>
      </div>
    </section>
  );
}
