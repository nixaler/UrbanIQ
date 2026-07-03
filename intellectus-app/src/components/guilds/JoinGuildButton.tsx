'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { joinGuild, leaveGuild } from '@/lib/actions/guilds';

export default function JoinGuildButton({ guildId, isMember }: { guildId: string; isMember: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          if (isMember) await leaveGuild(guildId);
          else await joinGuild(guildId);
          router.refresh();
        })
      }
      className="text-xs font-medium px-3 py-1.5 rounded-md border border-[rgb(var(--nr-border))] hover:border-[rgb(var(--nr-accent))]"
    >
      {isMember ? 'Leave guild' : 'Join guild'}
    </button>
  );
}
