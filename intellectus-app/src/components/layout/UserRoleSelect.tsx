'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateUserRole } from '@/lib/actions/userAdmin';

const ROLES = ['reader', 'contributor', 'moderator', 'editor', 'admin'] as const;

export default function UserRoleSelect({ userId, currentRole }: { userId: string; currentRole: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <select
      defaultValue={currentRole}
      disabled={isPending}
      onChange={(e) =>
        startTransition(async () => {
          await updateUserRole({ userId, role: e.target.value as (typeof ROLES)[number] });
          router.refresh();
        })
      }
      className="text-xs rounded-md border border-[rgb(var(--nr-border))] bg-[rgb(var(--nr-bg))] px-2 py-1"
    >
      {ROLES.map((role) => (
        <option key={role} value={role}>
          {role}
        </option>
      ))}
    </select>
  );
}
