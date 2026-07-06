'use client';

import { useTransition } from 'react';
import { createCheckoutSession } from '@/lib/actions/subscriptions';

export default function SubscribeButton({ priceId }: { priceId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const { url } = await createCheckoutSession({
            priceId,
            successUrl: `${window.location.origin}/settings/subscription?success=true`,
            cancelUrl: `${window.location.origin}/settings/subscription?canceled=true`,
          });
          if (url) window.location.href = url;
        })
      }
      className="text-xs font-medium px-3 py-1.5 rounded-md bg-[rgb(var(--nr-accent))] text-[rgb(var(--nr-accent-ink))] disabled:opacity-50"
    >
      {isPending ? 'Redirecting…' : 'Subscribe'}
    </button>
  );
}
