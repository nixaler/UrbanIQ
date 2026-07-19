'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';

const MAX_DURATION_SECONDS = 60;

export function RecordBottle({ topicId }: { topicId: string }) {
  const router = useRouter();
  const { start, stop, recording, elapsedSeconds, blob } = useAudioRecorder({
    maxDurationSeconds: MAX_DURATION_SECONDS,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function submit() {
    if (!blob) return;
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('audio', blob, 'bottle.webm');
      form.append('topicId', topicId);
      form.append('durationSeconds', String(elapsedSeconds));
      const res = await fetch('/api/bottles', { method: 'POST', body: form });
      if (res.ok) setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="space-y-3 text-center">
        <p className="text-lg font-medium">Your bottle is in the water.</p>
        <p className="text-ink-muted">A listener will hear it and can reply within the next couple of days.</p>
        <button type="button" onClick={() => router.push('/')} className="text-sm underline">
          Back to home
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-center">
      <div className="text-3xl font-semibold tabular-nums">
        {elapsedSeconds}s / {MAX_DURATION_SECONDS}s
      </div>
      {!recording && !blob && (
        <button type="button" onClick={start} className="rounded-md bg-accent px-4 py-2 font-medium text-white">
          Start recording
        </button>
      )}
      {recording && (
        <button type="button" onClick={stop} className="rounded-md bg-critical px-4 py-2 font-medium text-white">
          Stop
        </button>
      )}
      {blob && !recording && (
        <div className="space-y-2">
          <audio controls src={URL.createObjectURL(blob)} className="mx-auto" />
          <div className="flex justify-center gap-2">
            <button type="button" onClick={start} className="rounded-md border border-border px-4 py-2 text-sm">
              Re-record
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={submit}
              className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {submitting ? 'Sending…' : 'Send this bottle'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
