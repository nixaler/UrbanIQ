import Link from 'next/link';
import { signOutAction } from '@/lib/actions/auth';

const LINKS = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/onboarding', label: 'LLC & onboarding' },
  { href: '/dashboard/crm', label: 'CRM' },
  { href: '/dashboard/social', label: 'Social' },
  { href: '/dashboard/coaching', label: 'Coaching' },
];

export default function DashboardNav({ displayName }: { displayName: string }) {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-sm font-semibold tracking-[0.2em] uppercase">
            niXaler
          </Link>
          <nav className="flex flex-wrap items-center gap-6 text-sm">
            {LINKS.map((l) => (
              <Link key={l.href} href={l.href} className="text-ink-muted hover:text-ink transition">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-4 text-sm text-ink-muted">
          <span>{displayName}</span>
          <form action={signOutAction}>
            <button type="submit" className="hover:text-ink transition">
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
