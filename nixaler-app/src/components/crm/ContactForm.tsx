'use client';

import { useRef } from 'react';
import { createContactAction } from '@/lib/actions/crm';

export default function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await createContactAction(formData);
        formRef.current?.reset();
      }}
      className="grid gap-3 rounded-lg border border-border bg-bg-raised p-5 sm:grid-cols-2"
    >
      <input
        name="name"
        placeholder="Name"
        required
        className="rounded-md border border-border bg-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
      />
      <input
        name="email"
        type="email"
        placeholder="Email"
        className="rounded-md border border-border bg-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
      />
      <input
        name="phone"
        placeholder="Phone"
        className="rounded-md border border-border bg-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
      />
      <input
        name="company"
        placeholder="Company"
        className="rounded-md border border-border bg-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
      />
      <textarea
        name="notes"
        placeholder="Notes"
        rows={2}
        className="sm:col-span-2 rounded-md border border-border bg-bg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
      />
      <button
        type="submit"
        className="sm:col-span-2 rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-ink hover:opacity-90 transition"
      >
        Add contact
      </button>
    </form>
  );
}
