'use client';

interface ExtendConsentBannerProps {
  isRequester: boolean;
  onAccept: () => void;
  onDecline: () => void;
  submitting: boolean;
}

// Shown to the participant who did NOT request the extend — a ~30s
// accept/decline window is enforced by the caller (see call page), not here.
export function ExtendConsentBanner({ isRequester, onAccept, onDecline, submitting }: ExtendConsentBannerProps) {
  if (isRequester) {
    return (
      <div className="rounded-md border border-accent bg-bg-raised p-3 text-sm">
        Waiting for the other person to accept your request to keep talking…
      </div>
    );
  }

  return (
    <div className="space-y-2 rounded-md border border-accent bg-bg-raised p-3 text-sm">
      <p>The other person would like to keep talking, with no time limit. Are you okay with that?</p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={submitting}
          onClick={onAccept}
          className="flex-1 rounded-md bg-accent py-2 font-medium text-white disabled:opacity-50"
        >
          Yes, continue
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={onDecline}
          className="flex-1 rounded-md border border-border py-2 font-medium disabled:opacity-50"
        >
          No, end here
        </button>
      </div>
    </div>
  );
}
