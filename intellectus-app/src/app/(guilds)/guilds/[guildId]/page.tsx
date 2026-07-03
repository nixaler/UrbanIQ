import { notFound } from 'next/navigation';
import { db } from '@/lib/db/client';
import { guilds, guildMembers, guildStreaks, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import GuildStreakMeter from '@/components/guilds/GuildStreakMeter';
import JoinGuildButton from '@/components/guilds/JoinGuildButton';
import { getCurrentUserProfile } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export default async function GuildDetailPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;

  const [guild] = await db.select().from(guilds).where(eq(guilds.id, guildId)).limit(1);
  if (!guild) notFound();

  const [streak, members, viewer] = await Promise.all([
    db.select().from(guildStreaks).where(eq(guildStreaks.guildId, guildId)).limit(1).then((r) => r[0] ?? null),
    db
      .select({ userId: guildMembers.userId, displayName: users.displayName })
      .from(guildMembers)
      .innerJoin(users, eq(guildMembers.userId, users.id))
      .where(eq(guildMembers.guildId, guildId)),
    getCurrentUserProfile(),
  ]);

  const isMember = viewer ? members.some((m) => m.userId === viewer.id) : false;

  return (
    <main className="min-h-screen bg-[rgb(var(--nr-bg))] text-[rgb(var(--nr-ink))]">
      <div className="max-w-2xl mx-auto px-6 py-12 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">{guild.name}</h1>
          {viewer && <JoinGuildButton guildId={guild.id} isMember={isMember} />}
        </div>

        <GuildStreakMeter
          currentStreak={streak?.currentStreak ?? 0}
          multiplier={streak?.multiplier ?? 1}
          memberCount={members.length}
        />

        <div>
          <h2 className="text-xs uppercase tracking-widest text-[rgb(var(--nr-ink-muted))] font-semibold mb-3">
            Members
          </h2>
          <ul className="space-y-1 text-sm">
            {members.map((m) => (
              <li key={m.userId}>{m.displayName}</li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
