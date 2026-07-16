import Link from 'next/link';

export default function MarketingFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold tracking-[0.2em] uppercase">niXaler</p>
          <p className="mt-1 text-xs text-ink-muted">
            niXaler LLC is not a law firm or CPA. Formation and tax-advantage guidance are
            facilitation services, not legal or tax advice.
          </p>
        </div>
        <div className="flex items-center gap-6 text-sm text-ink-muted">
          <Link href="/pricing" className="hover:text-ink transition">
            Pricing
          </Link>
          <Link href="/sign-in" className="hover:text-ink transition">
            Sign in
          </Link>
          <span>&copy; {new Date().getFullYear()} niXaler LLC</span>
        </div>
      </div>
    </footer>
  );
}
