'use client';

import { useState, useTransition } from 'react';
import { createTip } from '@/lib/actions/tips';

/**
 * Micro-Tipping (#23). Only rendered when TIPPING_ENABLED — see
 * createTip()'s note on why Stripe Connect onboarding must exist before
 * this goes live. This creates the PaymentIntent; actual card collection
 * (Stripe Elements) is a follow-up UI task, not wired here yet.
 */
export default function TipButton({ commentId }: { commentId: string }) {
  const [status, setStatus] = useState<'idle' | 'created' | 'error'>('idle');
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending || status === 'created'}
      onClick={() =>
        startTransition(async () => {
          try {
            await createTip({ commentId, amountCents: 100 });
            setStatus('created');
          } catch {
            setStatus('error');
          }
        })
      }
      className="text-xs text-[rgb(var(--nr-agree))] hover:underline"
    >
      {status === 'created' ? 'Tip sent' : status === 'error' ? 'Tip failed' : 'Tip $1'}
    </button>
  );
}
