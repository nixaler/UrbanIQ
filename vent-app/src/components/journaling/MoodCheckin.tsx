'use client';

import { useState } from 'react';

interface MoodCheckinProps {
  sessionId: string;
  onSubmitted: () => void;
}

export function MoodCheckin({ sessionId, onSubmitted }: MoodCheckinProps) {
  const [moodAfter, setMoodAfter] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    if (!moodAfter) return;
    setSubmitting(true);
    try {
      await fetch('/api/mood-checkins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, moodAfter }),
      });
      setDone(true);
      onSubmitted();
    } finally {
      setSubmitting(false);
    }
  }

  if (done) return <p className="text-sm text-ink-muted">Thanks for checking in with yourself.</p>;

  return (
    <div className="space-y-2 rounded-lg border border-border bg-bg-raised p-4">
      <p className="text-sm font-medium">How do you feel right now, compared to before?</p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setMoodAfter(value)}
            className={`h-10 w-10 rounded-full border text-sm ${
              moodAfter === value ? 'border-accent bg-accent text-white' : 'border-border'
            }`}
          >
            {value}
          </button>
        ))}
      </div>
      <p className="text-xs text-ink-muted">1 = much worse · 5 = much better. This is private to you.</p>
      <button
        type="button"
        disabled={!moodAfter || submitting}
        onClick={submit}
        className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        Submit
      </button>
    </div>
  );
}
