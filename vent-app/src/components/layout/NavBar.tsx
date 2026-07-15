import Link from 'next/link';

export function NavBar() {
  return (
    <header className="border-b border-border">
      <nav className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold">
          vent
        </Link>
        <div className="flex items-center gap-4 text-sm text-ink-muted">
          <Link href="/topics">Vent</Link>
          <Link href="/queue">Listen</Link>
          <Link href="/bottles">Bottles</Link>
          <Link href="/profile/garden">Garden</Link>
        </div>
      </nav>
    </header>
  );
}
