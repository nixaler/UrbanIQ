'use client';

import { useRef } from 'react';
import { createPostAction } from '@/lib/actions/social';

const PLATFORMS = ['instagram', 'tiktok', 'facebook', 'linkedin', 'x', 'youtube', 'other'];

export default function PostForm() {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await createPostAction(formData);
        formRef.current?.reset();
      }}
      className="grid gap-3 rounded-lg border border-border bg-bg-raised p-5 sm:grid-cols-2"
    >
      <select
        name="platform"
        required
        defaultValue=""
        className="rounded-md border border-border bg-bg px-3 py-2 text-sm capitalize focus:outline-none focus:ring-2 focus:ring-accent"
      >
        <option value="" disabled>
          Platform
        </option>
        {PLATFORMS.map((p) => (
          <option key={p} value={p} className="capitalize">
            {p}
          </option>
        ))}
      </select>
      <input
        name="scheduledAt"
        type="datetime-local"
        className="rounded-md border border-border bg-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
      />
      <textarea
        name="caption"
        placeholder="Caption"
        required
        rows={3}
        className="sm:col-span-2 rounded-md border border-border bg-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
      />
      <input
        name="mediaUrl"
        placeholder="Media URL (optional)"
        className="sm:col-span-2 rounded-md border border-border bg-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
      />
      <button
        type="submit"
        className="sm:col-span-2 rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-ink hover:opacity-90 transition"
      >
        Add to calendar
      </button>
    </form>
  );
}
