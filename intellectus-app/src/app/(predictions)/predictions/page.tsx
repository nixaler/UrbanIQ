import { db } from '@/lib/db/client';
import { predictions, predictionStakes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import PredictionCard from '@/components/predictions/PredictionCard';
import { getCurrentUserProfile } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export default async function PredictionsPage() {
  const [allPredictions, viewer] = await Promise.all([
    db.select().from(predictions),
    getCurrentUserProfile(),
  ]);

  const cards = await Promise.all(
    allPredictions.map(async (prediction) => {
      const stakes = await db
        .select()
        .from(predictionStakes)
        .where(eq(predictionStakes.predictionId, prediction.id));

      return {
        prediction,
        yesTotal: stakes.filter((s) => s.side).reduce((sum, s) => sum + s.amount, 0),
        noTotal: stakes.filter((s) => !s.side).reduce((sum, s) => sum + s.amount, 0),
      };
    }),
  );

  return (
    <main className="min-h-screen bg-[rgb(var(--nr-bg))] text-[rgb(var(--nr-ink))]">
      <div className="max-w-2xl mx-auto px-6 py-12 space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Predictions</h1>
        {viewer && (
          <p className="text-xs text-[rgb(var(--nr-ink-muted))]">
            Your balance: {viewer.knowledgePoints} Knowledge Points
          </p>
        )}

        <div className="space-y-4">
          {cards.map(({ prediction, yesTotal, noTotal }) => (
            <PredictionCard
              key={prediction.id}
              id={prediction.id}
              question={prediction.question}
              closesAt={prediction.closesAt.toISOString()}
              status={prediction.status}
              yesTotal={yesTotal}
              noTotal={noTotal}
              canStake={Boolean(viewer)}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
