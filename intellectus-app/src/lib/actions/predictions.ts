'use server';

import { db } from '@/lib/db/client';
import { predictions, predictionStakes, users } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { requireUser, requireRole } from '@/lib/auth/guards';

/**
 * Predictive Staking (#14). Settles in virtual Knowledge Points only.
 * Real-money settlement was flagged as a distinct, separately-scoped
 * feature pending legal/regulatory review (gambling-law exposure) — do not
 * wire Stripe into this file without that review completing first.
 */
export async function createPrediction(params: { articleId?: string; question: string; closesAt: Date }) {
  await requireRole('editor');

  const [prediction] = await db
    .insert(predictions)
    .values({ articleId: params.articleId, question: params.question, closesAt: params.closesAt })
    .returning();

  return prediction;
}

export async function stakeOnPrediction(params: { predictionId: string; side: boolean; amount: number }) {
  const user = await requireUser();
  const { predictionId, side, amount } = params;

  if (amount <= 0) throw new Error('Stake must be positive');

  const [prediction] = await db.select().from(predictions).where(eq(predictions.id, predictionId)).limit(1);
  if (!prediction) throw new Error('Prediction not found');
  if (prediction.status !== 'open') throw new Error('Prediction is no longer open');
  if (prediction.closesAt.getTime() <= Date.now()) throw new Error('Prediction has closed');
  if (user.knowledgePoints < amount) throw new Error('Not enough Knowledge Points');

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ knowledgePoints: sql`${users.knowledgePoints} - ${amount}` })
      .where(eq(users.id, user.id));

    await tx.insert(predictionStakes).values({ predictionId, userId: user.id, side, amount });
  });
}

/**
 * Pari-mutuel settlement: the losing side's pool is split among winners in
 * proportion to their stake, then returned alongside their own stake.
 */
export async function settlePrediction(params: { predictionId: string; outcome: boolean }) {
  await requireRole('editor');
  const { predictionId, outcome } = params;

  const stakes = await db.select().from(predictionStakes).where(eq(predictionStakes.predictionId, predictionId));
  const winners = stakes.filter((s) => s.side === outcome);
  const losers = stakes.filter((s) => s.side !== outcome);

  const winningPool = winners.reduce((sum, s) => sum + s.amount, 0);
  const losingPool = losers.reduce((sum, s) => sum + s.amount, 0);

  await db.transaction(async (tx) => {
    for (const stake of winners) {
      const share = winningPool > 0 ? stake.amount / winningPool : 0;
      const payout = stake.amount + Math.floor(share * losingPool);

      await tx
        .update(users)
        .set({ knowledgePoints: sql`${users.knowledgePoints} + ${payout}` })
        .where(eq(users.id, stake.userId));

      await tx.update(predictionStakes).set({ settled: true }).where(eq(predictionStakes.id, stake.id));
    }

    for (const stake of losers) {
      await tx.update(predictionStakes).set({ settled: true }).where(eq(predictionStakes.id, stake.id));
    }

    await tx
      .update(predictions)
      .set({ status: outcome ? 'resolved_yes' : 'resolved_no' })
      .where(eq(predictions.id, predictionId));
  });
}
