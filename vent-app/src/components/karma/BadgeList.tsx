interface Badge {
  id: string;
  name: string;
  description: string;
  earnedAt: string;
}

export function BadgeList({ badges }: { badges: Badge[] }) {
  if (badges.length === 0) {
    return <p className="text-sm text-ink-muted">No badges yet — they show up quietly as you go.</p>;
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {badges.map((badge) => (
        <div key={badge.id} className="rounded-md border border-border bg-bg-raised p-3">
          <div className="font-medium">{badge.name}</div>
          <div className="text-sm text-ink-muted">{badge.description}</div>
        </div>
      ))}
    </div>
  );
}
