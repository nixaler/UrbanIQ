'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createGuild } from '@/lib/actions/guilds';

export default function CreateGuildForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [isPending, startTransition] = useTransition();

  function submit() {
    if (!name.trim()) return;
    startTransition(async () => {
      const guild = await createGuild(name);
      setName('');
      router.push(`/guilds/${guild.id}`);
    });
  }

  return (
    <div className="flex gap-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Guild name…"
        className="flex-1 rounded-lg border border-[rgb(var(--nr-border))] bg-[rgb(var(--nr-bg-raised))] px-3 py-2 text-sm focus:outline-none focus:border-[rgb(var(--nr-accent))]"
      />
      <button
        onClick={submit}
        disabled={isPending || !name.trim()}
        className="text-xs font-medium px-3 py-2 rounded-md bg-[rgb(var(--nr-accent))] text-[rgb(var(--nr-accent-ink))] disabled:opacity-50"
      >
        Create
      </button>
    </div>
  );
}
