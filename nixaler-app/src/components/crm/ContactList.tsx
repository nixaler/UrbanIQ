'use client';

import { useTransition } from 'react';
import type { crmContacts, crmStageEnum } from '@/lib/db/schema';
import { updateContactStageAction, deleteContactAction } from '@/lib/actions/crm';
import StageBadge from './StageBadge';

type Contact = typeof crmContacts.$inferSelect;
const STAGES = ['lead', 'qualified', 'customer', 'churned'] satisfies (typeof crmStageEnum.enumValues)[number][];

export default function ContactList({ contacts }: { contacts: Contact[] }) {
  const [isPending, startTransition] = useTransition();

  if (contacts.length === 0) {
    return <p className="text-sm text-ink-muted">No contacts yet — add your first one above.</p>;
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-bg-raised text-left text-ink-muted">
          <tr>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Contact</th>
            <th className="px-4 py-3 font-medium">Company</th>
            <th className="px-4 py-3 font-medium">Stage</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {contacts.map((c) => (
            <tr key={c.id}>
              <td className="px-4 py-3 font-medium">{c.name}</td>
              <td className="px-4 py-3 text-ink-muted">{c.email || c.phone || '—'}</td>
              <td className="px-4 py-3 text-ink-muted">{c.company || '—'}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <StageBadge stage={c.stage} />
                  <select
                    aria-label="Change stage"
                    value={c.stage}
                    disabled={isPending}
                    onChange={(e) =>
                      startTransition(() => {
                        updateContactStageAction(c.id, e.target.value as (typeof STAGES)[number]);
                      })
                    }
                    className="rounded-md border border-border bg-bg px-1.5 py-0.5 text-xs"
                  >
                    {STAGES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => startTransition(() => deleteContactAction(c.id))}
                  className="text-xs text-ink-muted hover:text-red-500"
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
