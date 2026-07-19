import Link from 'next/link';

export function KarmaToast() {
  return (
    <div className="rounded-lg border border-accent bg-bg-raised p-4 text-sm">
      Thank you for listening. Your Empathy Garden just grew a little.{' '}
      <Link href="/profile/garden" className="underline">
        Take a look
      </Link>
      .
    </div>
  );
}
