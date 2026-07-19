import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold">Say it. Be heard. Move on.</h1>
      <p className="max-w-prose text-ink-muted">
        Pick a topic, get 60 seconds to vent to a stranger who&apos;s ready to listen. No
        names, no pressure, no advice unless you want it.
      </p>
      <div className="flex gap-3">
        <Link
          href="/topics"
          className="rounded-md bg-accent px-4 py-2 font-medium text-white"
        >
          Vent now
        </Link>
        <Link
          href="/queue"
          className="rounded-md border border-border px-4 py-2 font-medium"
        >
          Listen instead
        </Link>
      </div>
    </div>
  );
}
