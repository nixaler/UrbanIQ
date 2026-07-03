import Link from 'next/link';
import { db } from '@/lib/db/client';
import { guilds, guildMembers, guildStreaks } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import CreateGuildForm from '@/components/guilds/CreateGuildForm';

export const dynamic = 'force-dynamic';

export default async function GuildsPage() {
  const rows = await db
    .select({
      id: guilds.id,
      name: guilds.name,
      currentStreak: guildStreaks.currentStreak,
      multiplier: guildStreaks.multiplier,
      memberCount: sql<number>`count(${guildMembers.id})`.as('member_count'),
    })
    .from(guilds)
    .leftJoin(guildStreaks, eq(guildStreaks.guildId, guilds.id))
    .leftJoin(guildMembers, eq(guildMembers.guildId, guilds.id))
    .groupBy(guilds.id, guildStreaks.currentStreak, guildStreaks.multiplier);

  return (
    <main className="min-h-screen bg-[rgb(var(--nr-bg))] text-[rgb(var(--nr-ink))]">
      <div className="max-w-2xl mx-auto px-6 py-12 space-y-8">
        <h1 className="text-2xl font-bold tracking-tight">Reading Guilds</h1>
        <CreateGuildForm />

        <ul className="space-y-3">
          {rows.map((guild) => (
            <li key={guild.id}>
              <Link
                href={`/guilds/${guild.id}`}
                className="flex items-center justify-between p-4 rounded-lg border border-[rgb(var(--nr-border))] bg-[rgb(var(--nr-bg-raised))] hover:border-[rgb(var(--nr-accent)/0.5)]"
              >
                <span className="font-medium">{guild.name}</span>
                <span className="text-xs text-[rgb(var(--nr-ink-muted))]">
                  {guild.memberCount} members · {(guild.multiplier ?? 1).toFixed(1)}×
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
