const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-ink-muted/10 text-ink-muted',
  scheduled: 'bg-accent/10 text-accent',
  posted: 'bg-green-500/10 text-green-600',
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLE[status] ?? ''}`}>
      {status}
    </span>
  );
}
