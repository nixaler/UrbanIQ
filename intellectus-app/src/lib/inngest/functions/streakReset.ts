import { inngest } from '../client';
import { db } from '@/lib/db/client';
import { guilds, guildMembers, guildStreaks, readingProgress, articles } from '@/lib/db/schema';
import { eq, and, gte } from 'drizzle-orm';

/**
 * Communal Streaks (#13): if ANY guild member missed today's read, the
 * whole guild's multiplier drops back to 1x — not just that member's.
 * Runs nightly via Vercel Cron hitting an endpoint that sends this event.
 */
export const streakReset = inngest.createFunction(
  { id: 'guild-streak-nightly-reset' },
  { event: 'streaks/nightly-reset.requested' },
  async ({ step }) => {
    const allGuilds = await step.run('load-guilds', () => db.select().from(guilds));

    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);

    for (const guild of allGuilds) {
      await step.run(`recompute-guild-${guild.id}`, async () => {
        const members = await db
          .select()
          .from(guildMembers)
          .where(eq(guildMembers.guildId, guild.id));

        if (members.length === 0) return;

        const memberReadStatuses = await Promise.all(
          members.map(async (member) => {
            const rows = await db
              .select({ id: readingProgress.id })
              .from(readingProgress)
              .innerJoin(articles, eq(readingProgress.articleId, articles.id))
              .where(
                and(
                  eq(readingProgress.userId, member.userId),
                  eq(readingProgress.unlockedComments, true),
                  gte(articles.publishDate, startOfToday.toISOString().slice(0, 10)),
                ),
              )
              .limit(1);
            return rows.length > 0;
          }),
        );

        const everyoneRead = memberReadStatuses.every(Boolean);

        const [existing] = await db
          .select()
          .from(guildStreaks)
          .where(eq(guildStreaks.guildId, guild.id))
          .limit(1);

        const nextStreak = everyoneRead ? (existing?.currentStreak ?? 0) + 1 : 0;
        const nextMultiplier = everyoneRead ? Math.min(3, 1 + nextStreak * 0.1) : 1;

        await db
          .insert(guildStreaks)
          .values({
            guildId: guild.id,
            currentStreak: nextStreak,
            multiplier: nextMultiplier,
            lastResetDate: startOfToday.toISOString().slice(0, 10),
          })
          .onConflictDoUpdate({
            target: guildStreaks.guildId,
            set: {
              currentStreak: nextStreak,
              multiplier: nextMultiplier,
              lastResetDate: startOfToday.toISOString().slice(0, 10),
              updatedAt: new Date(),
            },
          });
      });
    }

    return { guildsProcessed: allGuilds.length };
  },
);
