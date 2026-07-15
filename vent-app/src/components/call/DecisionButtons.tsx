'use client';

interface DecisionButtonsProps {
  onSendSupport: () => void;
  onExtendCall: () => void;
  onFollowIssue: () => void;
  submitting: boolean;
}

// Shown to the Listener once the 60s vent ends.
export function DecisionButtons({ onSendSupport, onExtendCall, onFollowIssue, submitting }: DecisionButtonsProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-ink-muted">Time&apos;s up. What would you like to do?</p>
      <div className="grid gap-2">
        <button
          type="button"
          disabled={submitting}
          onClick={onSendSupport}
          className="rounded-md border border-border py-2 font-medium disabled:opacity-50"
        >
          Send Support
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={onExtendCall}
          className="rounded-md bg-accent py-2 font-medium text-white disabled:opacity-50"
        >
          Extend Call
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={onFollowIssue}
          className="rounded-md border border-border py-2 font-medium disabled:opacity-50"
        >
          Follow This Issue
        </button>
      </div>
    </div>
  );
}
