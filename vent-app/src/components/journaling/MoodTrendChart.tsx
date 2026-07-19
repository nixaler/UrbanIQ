interface MoodEntry {
  moodBefore: number | null;
  moodAfter: number;
  createdAt: string;
}

// Private to the user — never shared, never aggregated into anyone else's
// view. Deliberately a plain bar row rather than a charting library, since
// this is a handful of points, not a dashboard.
export function MoodTrendChart({ entries }: { entries: MoodEntry[] }) {
  if (entries.length === 0) {
    return <p className="text-sm text-ink-muted">Check in after a vent to start seeing your trend here.</p>;
  }

  const withDelta = entries.filter((e) => e.moodBefore !== null);
  const avgDelta =
    withDelta.length > 0
      ? withDelta.reduce((sum, e) => sum + (e.moodAfter - (e.moodBefore ?? e.moodAfter)), 0) / withDelta.length
      : null;

  return (
    <div className="space-y-3">
      {avgDelta !== null && (
        <p className="text-sm">
          Venting usually shifts your mood by{' '}
          <strong className={avgDelta >= 0 ? 'text-accent' : 'text-critical'}>
            {avgDelta >= 0 ? '+' : ''}
            {avgDelta.toFixed(1)}
          </strong>{' '}
          points afterward.
        </p>
      )}
      <div className="flex items-end gap-1">
        {entries.slice(-14).map((entry, i) => (
          <div
            key={i}
            title={`After: ${entry.moodAfter}/5`}
            className="w-4 rounded-t bg-accent"
            style={{ height: `${entry.moodAfter * 8}px` }}
          />
        ))}
      </div>
    </div>
  );
}
