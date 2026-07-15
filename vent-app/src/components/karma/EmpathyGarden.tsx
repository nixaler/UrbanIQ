const BLOOM_EMOJI = ['🌱', '🌿', '🌾', '🌸', '🌺', '🌻', '🌳'];

interface EmpathyGardenProps {
  droplets: number;
  bloomStage: number;
}

// Comparative only to the user's own past — no leaderboard, no ranking
// against other users. Deliberately simple for MVP.
export function EmpathyGarden({ droplets, bloomStage }: EmpathyGardenProps) {
  const emoji = BLOOM_EMOJI[Math.min(bloomStage, BLOOM_EMOJI.length - 1)];
  const dropletsIntoStage = droplets % 50;

  return (
    <div className="space-y-3 rounded-lg border border-border bg-bg-raised p-6 text-center">
      <div className="text-6xl">{emoji}</div>
      <div className="text-lg font-medium">{droplets} droplets</div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-border">
        <div className="h-full bg-accent" style={{ width: `${(dropletsIntoStage / 50) * 100}%` }} />
      </div>
      <p className="text-xs text-ink-muted">{50 - dropletsIntoStage} droplets to the next bloom</p>
    </div>
  );
}
