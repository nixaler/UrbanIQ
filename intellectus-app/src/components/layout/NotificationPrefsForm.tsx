'use client';

import { useState, useTransition } from 'react';
import { updateNotificationPrefs } from '@/lib/actions/notifications';

interface NotificationPrefsFormProps {
  initialTime: string;
  initialTimezone: string;
  initialPush: boolean;
  initialEmail: boolean;
}

export default function NotificationPrefsForm({
  initialTime,
  initialTimezone,
  initialPush,
  initialEmail,
}: NotificationPrefsFormProps) {
  const [time, setTime] = useState(initialTime.slice(0, 5));
  const [timezone, setTimezone] = useState(initialTimezone);
  const [push, setPush] = useState(initialPush);
  const [email, setEmail] = useState(initialEmail);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      await updateNotificationPrefs({ intelWindowTime: `${time}:00`, timezone, push, email });
      setSaved(true);
    });
  }

  return (
    <div className="space-y-4 max-w-sm">
      <div>
        <label className="text-xs text-[rgb(var(--nr-ink-muted))] block mb-1">Intel Window</label>
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="rounded-md border border-[rgb(var(--nr-border))] bg-[rgb(var(--nr-bg-raised))] px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="text-xs text-[rgb(var(--nr-ink-muted))] block mb-1">Timezone (IANA)</label>
        <input
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          placeholder="America/New_York"
          className="w-full rounded-md border border-[rgb(var(--nr-border))] bg-[rgb(var(--nr-bg-raised))] px-3 py-2 text-sm"
        />
      </div>
      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={push} onChange={(e) => setPush(e.target.checked)} className="accent-[rgb(var(--nr-accent))]" />
          Push
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={email} onChange={(e) => setEmail(e.target.checked)} className="accent-[rgb(var(--nr-accent))]" />
          Email
        </label>
      </div>
      <button
        onClick={save}
        disabled={isPending}
        className="text-xs font-medium px-3 py-1.5 rounded-md bg-[rgb(var(--nr-accent))] text-[rgb(var(--nr-accent-ink))]"
      >
        {isPending ? 'Saving…' : 'Save'}
      </button>
      {saved && !isPending && <p className="text-xs text-[rgb(var(--nr-ink-muted))]">Saved.</p>}
    </div>
  );
}
