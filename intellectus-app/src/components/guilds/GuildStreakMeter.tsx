interface GuildStreakMeterProps {
  currentStreak: number;
  multiplier: number;
  memberCount: number;
}

/**
 * Communal Streaks (#13): the multiplier is shared, not per-member — if any
 * guild member missed their daily read, streakReset.ts drops this back to
 * 1x for everyone, which is why the UI shows one shared number, not a
 * per-user breakdown.
 */
export default function GuildStreakMeter({ currentStreak, multiplier, memberCount }: GuildStreakMeterProps) {
  return (
    <div className="flex items-center gap-6 p-4 rounded-xl border border-[rgb(var(--nr-border))] bg-[rgb(var(--nr-bg-raised))]">
      <div>
        <div className="text-2xl font-bold">{currentStreak}</div>
        <div className="text-xs text-[rgb(var(--nr-ink-muted))] uppercase tracking-wide">Day streak</div>
      </div>
      <div>
        <div className="text-2xl font-bold text-[rgb(var(--nr-accent))]">{multiplier.toFixed(1)}×</div>
        <div className="text-xs text-[rgb(var(--nr-ink-muted))] uppercase tracking-wide">Multiplier</div>
      </div>
      <div>
        <div className="text-2xl font-bold">{memberCount}</div>
        <div className="text-xs text-[rgb(var(--nr-ink-muted))] uppercase tracking-wide">Members</div>
      </div>
    </div>
  );
}
