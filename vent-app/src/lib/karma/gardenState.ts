import 'server-only';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { gardenState } from '@/lib/db/schema';

// One droplet per karma point, a new bloom stage every 50 droplets. Deliberately
// simple for MVP — comparative only to the user's own past, never a ranking.
const DROPLETS_PER_BLOOM_STAGE = 50;

export async function updateGardenState(userId: string, pointsEarned: number) {
  const [existing] = await db.select().from(gardenState).where(eq(gardenState.userId, userId)).limit(1);

  const droplets = (existing?.droplets ?? 0) + pointsEarned;
  const bloomStage = Math.floor(droplets / DROPLETS_PER_BLOOM_STAGE);

  if (existing) {
    await db
      .update(gardenState)
      .set({ droplets, bloomStage, updatedAt: new Date() })
      .where(eq(gardenState.userId, userId));
  } else {
    await db.insert(gardenState).values({ userId, droplets, bloomStage });
  }
}
