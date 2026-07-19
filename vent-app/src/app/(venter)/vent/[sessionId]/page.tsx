'use client';

import { use } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useMatchPolling } from '@/hooks/useMatchPolling';

export default function VentWaitingPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const searchParams = useSearchParams();
  const queueEntryId = searchParams.get('queueEntryId');

  const { data } = useMatchPolling(queueEntryId);
  const status = data?.queueEntry.status;

  if (status === 'expired') {
    return (
      <div className="space-y-4 text-center">
        <p className="text-lg font-medium">No listeners are available right now.</p>
        <p className="text-ink-muted">
          You can still get your vent out — record it and a listener will reply when they&apos;re online.
        </p>
        <Link
          href={`/bottles/record?sessionId=${sessionId}`}
          className="inline-block rounded-md bg-accent px-4 py-2 font-medium text-white"
        >
          Record a Message in a Bottle
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-center">
      <div className="mx-auto h-3 w-3 animate-pulse rounded-full bg-accent" />
      <p className="text-lg font-medium">Finding someone to listen…</p>
      <p className="text-sm text-ink-muted">This usually takes less than a minute.</p>
    </div>
  );
}
