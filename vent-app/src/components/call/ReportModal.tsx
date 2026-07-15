'use client';

import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';

const REASONS = [
  { value: 'harassment', label: 'Harassment or bullying' },
  { value: 'hate_speech', label: 'Hate speech' },
  { value: 'self_harm_risk', label: 'They may be at risk of self-harm' },
  { value: 'sexual_content', label: 'Sexual content' },
  { value: 'spam', label: 'Spam or scam' },
  { value: 'other', label: 'Other' },
] as const;

interface ReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  reportedUserId: string;
}

export function ReportModal({ open, onOpenChange, sessionId, reportedUserId }: ReportModalProps) {
  const [reasonCode, setReasonCode] = useState<(typeof REASONS)[number]['value']>('harassment');
  const [note, setNote] = useState('');
  const [alsoBlock, setAlsoBlock] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function submit() {
    setSubmitting(true);
    try {
      await Promise.all([
        fetch('/api/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, reportedUserId, reasonCode, note: note || undefined }),
        }),
        alsoBlock
          ? fetch('/api/blocks', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ blockedUserId: reportedUserId }),
            })
          : Promise.resolve(),
      ]);
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-bg-raised p-6 shadow-xl">
          {submitted ? (
            <div className="space-y-4">
              <Dialog.Title className="text-lg font-semibold">Report received</Dialog.Title>
              <p className="text-sm text-ink-muted">
                Thank you — our moderation team will review this shortly.
              </p>
              <Dialog.Close asChild>
                <button type="button" className="w-full rounded-md bg-accent py-2 text-white">
                  Close
                </button>
              </Dialog.Close>
            </div>
          ) : (
            <div className="space-y-4">
              <Dialog.Title className="text-lg font-semibold">Report this person</Dialog.Title>
              <div className="space-y-2">
                {REASONS.map((reason) => (
                  <label key={reason.value} className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="reasonCode"
                      value={reason.value}
                      checked={reasonCode === reason.value}
                      onChange={() => setReasonCode(reason.value)}
                    />
                    {reason.label}
                  </label>
                ))}
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Anything else you'd like to add (optional)"
                className="w-full rounded-md border border-border bg-bg p-2 text-sm"
                rows={3}
              />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={alsoBlock} onChange={(e) => setAlsoBlock(e.target.checked)} />
                Also block this person so you&apos;re never matched again
              </label>
              <button
                type="button"
                disabled={submitting}
                onClick={submit}
                className="w-full rounded-md bg-critical py-2 font-medium text-white disabled:opacity-50"
              >
                {submitting ? 'Submitting…' : 'Submit report'}
              </button>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
