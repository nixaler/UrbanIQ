'use client';

import { useRef } from 'react';
import { requestSessionAction } from '@/lib/actions/coaching';

export default function SessionRequestForm() {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await requestSessionAction(formData);
        formRef.current?.reset();
      }}
      className="space-y-3 rounded-lg border border-border bg-bg-raised p-5"
    >
      <textarea
        name="notes"
        placeholder="What do you want to work on in your next session?"
        rows={3}
        className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
      />
      <button
        type="submit"
        className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-ink hover:opacity-90 transition"
      >
        Request a session
      </button>
    </form>
  );
}
