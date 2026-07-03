import StakeForm from './StakeForm';

interface PredictionCardProps {
  id: string;
  question: string;
  closesAt: string;
  status: 'open' | 'resolved_yes' | 'resolved_no' | 'voided';
  yesTotal: number;
  noTotal: number;
  canStake: boolean;
}

export default function PredictionCard({ id, question, closesAt, status, yesTotal, noTotal, canStake }: PredictionCardProps) {
  return (
    <div className="p-5 rounded-xl border border-[rgb(var(--nr-border))] bg-[rgb(var(--nr-bg-raised))] space-y-3">
      <p className="font-medium">{question}</p>
      <div className="text-xs text-[rgb(var(--nr-ink-muted))]">
        {status === 'open' ? `Closes ${new Date(closesAt).toLocaleString()}` : `Resolved: ${status.replace('resolved_', '')}`}
      </div>
      <div className="text-xs flex gap-4">
        <span className="text-[rgb(var(--nr-well-researched))]">Yes pool: {yesTotal} KP</span>
        <span className="text-[rgb(var(--nr-agree))]">No pool: {noTotal} KP</span>
      </div>
      {status === 'open' && canStake && <StakeForm predictionId={id} />}
    </div>
  );
}
