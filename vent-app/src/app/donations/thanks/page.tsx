import Link from 'next/link';

export default function DonationThanksPage() {
  return (
    <div className="space-y-3 text-center">
      <h1 className="text-2xl font-semibold">Thank you</h1>
      <p className="text-ink-muted">Your donation is on its way to the cause you chose.</p>
      <Link href="/" className="inline-block text-sm underline">
        Back to home
      </Link>
    </div>
  );
}
