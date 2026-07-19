interface TopicCardProps {
  name: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}

export function TopicCard({ name, description, selected, onClick }: TopicCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border p-4 text-left transition-colors ${
        selected ? 'border-accent bg-accent/10' : 'border-border bg-bg-raised hover:bg-bg'
      }`}
    >
      <div className="font-medium">{name}</div>
      <div className="text-sm text-ink-muted">{description}</div>
    </button>
  );
}
