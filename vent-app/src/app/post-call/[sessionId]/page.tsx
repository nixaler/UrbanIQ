'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useSession } from '@/hooks/useSession';
import { useCurrentUserId } from '@/hooks/useCurrentUserId';
import { MoodCheckin } from '@/components/journaling/MoodCheckin';
import { KarmaToast } from '@/components/karma/KarmaToast';
import { featureFlags } from '@/lib/config/featureFlags';

const DECISION_COPY: Record<string, string> = {
  send_support: 'They sent you support.',
  extend_call: 'You kept talking a while longer.',
  follow_issue: 'They chose to follow this issue and stay in your corner.',
  none: 'The call has ended.',
};

export default function PostCallPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const userId = useCurrentUserId();
  const { data } = useSession(sessionId);
  const session = data?.session;
  const [stars, setStars] = useState<number | null>(null);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [moodDone, setMoodDone] = useState(false);

  if (!session) return <p className="text-ink-muted">Loading…</p>;

  const isVenter = session.venterId === userId;

  async function submitRating(value: number) {
    setStars(value);
    await fetch('/api/ratings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, stars: value }),
    });
    setRatingSubmitted(true);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">All done</h1>
        <p className="text-ink-muted">{DECISION_COPY[session.decision ?? 'none']}</p>
      </div>

      {isVenter && !moodDone && <MoodCheckin sessionId={sessionId} onSubmitted={() => setMoodDone(true)} />}

      {isVenter && (
        <div className="space-y-2 rounded-lg border border-border bg-bg-raised p-4">
          <p className="text-sm font-medium">How did your listener do?</p>
          {ratingSubmitted ? (
            <p className="text-sm text-ink-muted">Thanks for the feedback.</p>
          ) : (
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => submitRating(value)}
                  className={`text-2xl ${stars && value <= stars ? 'text-accent' : 'text-border'}`}
                  aria-label={`${value} star${value > 1 ? 's' : ''}`}
                >
                  ★
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {!isVenter && featureFlags.karmaEnabled && <KarmaToast />}

      <Link href="/" className="inline-block text-sm text-ink-muted underline">
        Back to home
      </Link>
    </div>
  );
}
