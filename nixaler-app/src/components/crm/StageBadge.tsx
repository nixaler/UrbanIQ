const STAGE_STYLE: Record<string, string> = {
  lead: 'bg-ink-muted/10 text-ink-muted',
  qualified: 'bg-accent/10 text-accent',
  customer: 'bg-green-500/10 text-green-600',
  churned: 'bg-red-500/10 text-red-500',
};

export default function StageBadge({ stage }: { stage: string }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${STAGE_STYLE[stage] ?? ''}`}>
      {stage}
    </span>
  );
}
