'use client';

import { useState } from 'react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';

const MAX_DURATION_SECONDS = 30;

export function ReplyRecorder({ bottleId, onReplied }: { bottleId: string; onReplied: () => void }) {
  const { start, stop, recording, elapsedSeconds, blob } = useAudioRecorder({
    maxDurationSeconds: MAX_DURATION_SECONDS,
  });
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!blob) return;
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('audio', blob, 'reply.webm');
      form.append('durationSeconds', String(elapsedSeconds));
      const res = await fetch(`/api/bottles/${bottleId}/reply`, { method: 'POST', body: form });
      if (res.ok) onReplied();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-2 rounded-md border border-border bg-bg p-3">
      <div className="text-sm tabular-nums text-ink-muted">
        {elapsedSeconds}s / {MAX_DURATION_SECONDS}s
      </div>
      {!recording && !blob && (
        <button type="button" onClick={start} className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white">
          Record a reply
        </button>
      )}
      {recording && (
        <button type="button" onClick={stop} className="rounded-md bg-critical px-3 py-1.5 text-sm font-medium text-white">
          Stop
        </button>
      )}
      {blob && !recording && (
        <div className="flex items-center gap-2">
          <audio controls src={URL.createObjectURL(blob)} />
          <button
            type="button"
            disabled={submitting}
            onClick={submit}
            className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {submitting ? 'Sending…' : 'Send reply'}
          </button>
        </div>
      )}
    </div>
  );
}
