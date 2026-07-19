'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const ACTIONS = [
  { value: 'dismiss', label: 'Dismiss' },
  { value: 'warn', label: 'Warn' },
  { value: 'temp_suspend', label: 'Suspend 7 days' },
  { value: 'permanent_ban', label: 'Permanent ban' },
] as const;

export function ReportActions({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState<string | null>(null);

  async function act(action: (typeof ACTIONS)[number]['value']) {
    setSubmitting(action);
    try {
      await fetch(`/api/admin/reports/${reportId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      router.push('/admin/moderation-queue');
      router.refresh();
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {ACTIONS.map((action) => (
        <button
          key={action.value}
          type="button"
          disabled={!!submitting}
          onClick={() => act(action.value)}
          className={`rounded-md border px-3 py-2 text-sm font-medium disabled:opacity-50 ${
            action.value === 'permanent_ban' ? 'border-critical text-critical' : 'border-border'
          }`}
        >
          {submitting === action.value ? '…' : action.label}
        </button>
      ))}
    </div>
  );
}
