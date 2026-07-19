import { requireConsent } from '@/lib/auth/requireConsent';
import { getCurrentProfile } from '@/lib/auth/currentUser';
import { BottleInbox } from '@/components/bottles/BottleInbox';
import Link from 'next/link';

export default async function BottleInboxPage() {
  await requireConsent('/bottles');
  const profile = await getCurrentProfile();

  if (!profile?.listenerCertifiedAt) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Message in a Bottle inbox</h1>
        <p className="text-ink-muted">Complete the Listener Academy first to reply to bottles.</p>
        <Link href="/listener-academy" className="inline-block rounded-md bg-accent px-4 py-2 font-medium text-white">
          Start Listener Academy
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Message in a Bottle inbox</h1>
        <p className="text-ink-muted">Recorded vents waiting for a reply.</p>
      </div>
      <BottleInbox />
    </div>
  );
}
