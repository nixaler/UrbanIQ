interface TimerProps {
  secondsRemaining: number | null;
  totalSeconds: number;
}

export function Timer({ secondsRemaining, totalSeconds }: TimerProps) {
  if (secondsRemaining === null) {
    return <div className="text-sm text-ink-muted">Connecting…</div>;
  }

  const pct = Math.max(0, Math.min(100, (secondsRemaining / totalSeconds) * 100));

  return (
    <div className="space-y-1">
      <div className="h-2 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full bg-accent transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-center text-2xl font-semibold tabular-nums">{secondsRemaining}s</div>
    </div>
  );
}
