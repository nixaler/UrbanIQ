import Link from 'next/link';

export default function NavBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-sm font-semibold tracking-[0.2em] uppercase">
          niXaler
        </Link>
        <div className="flex items-center gap-8 text-sm">
          <Link href="/#offer" className="text-ink-muted hover:text-ink transition">
            What you get
          </Link>
          <Link href="/pricing" className="text-ink-muted hover:text-ink transition">
            Pricing
          </Link>
          <Link href="/sign-in" className="text-ink-muted hover:text-ink transition">
            Sign in
          </Link>
          <Link
            href="/pricing"
            className="rounded-full bg-accent px-4 py-2 text-accent-ink font-medium hover:opacity-90 transition"
          >
            Get started
          </Link>
        </div>
      </nav>
    </header>
  );
}
