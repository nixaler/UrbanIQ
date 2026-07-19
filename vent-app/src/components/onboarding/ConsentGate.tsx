'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useEnsureAnonymousAuth } from '@/hooks/useEnsureAnonymousAuth';
import { crisisResources, crisisDisclaimer } from '@/lib/config/crisisResources';

interface ConsentGateProps {
  nextPath: string;
}

// Blocking first-run screen. Nothing else in the app (queue, vent, bottles)
// is reachable before this is accepted — see requireConsent.ts.
export function ConsentGate({ nextPath }: ConsentGateProps) {
  const authReady = useEnsureAnonymousAuth();
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleContinue() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/consent', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to record consent');
      router.push(nextPath);
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold">Before you start</h1>

      <div className="space-y-3 rounded-lg border border-border bg-bg-raised p-4 text-sm">
        <p>
          <strong>vent</strong> connects you with another person for peer emotional support.
          It is <strong>not therapy, not medical treatment, and not a crisis-intervention
          service.</strong> Listeners are ordinary people, not licensed counselors, and
          nothing you share here is confidential or privileged in a legal sense.
        </p>
        <p>You can stay fully anonymous. No name or email is required.</p>
      </div>

      <div className="space-y-3 rounded-lg border border-critical/40 bg-bg-raised p-4 text-sm">
        <p className="font-medium text-critical">If you&apos;re in crisis right now:</p>
        <ul className="space-y-1">
          {crisisResources.map((resource) => (
            <li key={resource.label}>
              <a href={resource.href} className="underline">
                {resource.label}
              </a>{' '}
              — {resource.detail}
            </li>
          ))}
        </ul>
        <p className="text-ink-muted">{crisisDisclaimer}</p>
      </div>

      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          className="mt-1"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
        />
        <span>
          I understand this is peer support, not professional or crisis care, and I agree to
          the Terms of Service.
        </span>
      </label>

      {error && <p className="text-sm text-critical">{error}</p>}

      <button
        type="button"
        disabled={!accepted || !authReady || submitting}
        onClick={handleContinue}
        className="w-full rounded-md bg-accent py-2 font-medium text-white disabled:opacity-50"
      >
        {submitting ? 'Continuing…' : 'Continue'}
      </button>
    </div>
  );
}
