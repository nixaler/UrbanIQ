'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createSponsor } from '@/lib/actions/sponsors';

export default function CreateSponsorForm() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [disclosureCopy, setDisclosureCopy] = useState('');
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (!companyName.trim() || !contactEmail.trim() || !disclosureCopy.trim()) return;
    startTransition(async () => {
      await createSponsor({ companyName, contactEmail, disclosureCopy });
      setCompanyName('');
      setContactEmail('');
      setDisclosureCopy('');
      router.refresh();
    });
  }

  return (
    <div className="space-y-2 max-w-md">
      <input
        value={companyName}
        onChange={(e) => setCompanyName(e.target.value)}
        placeholder="Company name"
        className="w-full rounded-md border border-[rgb(var(--nr-border))] bg-[rgb(var(--nr-bg-raised))] px-3 py-2 text-sm"
      />
      <input
        value={contactEmail}
        onChange={(e) => setContactEmail(e.target.value)}
        placeholder="Contact email"
        className="w-full rounded-md border border-[rgb(var(--nr-border))] bg-[rgb(var(--nr-bg-raised))] px-3 py-2 text-sm"
      />
      <textarea
        value={disclosureCopy}
        onChange={(e) => setDisclosureCopy(e.target.value)}
        placeholder="Disclosure copy shown to readers"
        rows={2}
        className="w-full rounded-md border border-[rgb(var(--nr-border))] bg-[rgb(var(--nr-bg-raised))] px-3 py-2 text-sm resize-none"
      />
      <button
        onClick={submit}
        disabled={isPending}
        className="text-xs font-medium px-3 py-1.5 rounded-md bg-[rgb(var(--nr-accent))] text-[rgb(var(--nr-accent-ink))]"
      >
        Add sponsor
      </button>
    </div>
  );
}
