const STEPS: { key: string; label: string }[] = [
  { key: 'not_started', label: 'Not started' },
  { key: 'info_submitted', label: 'Info submitted' },
  { key: 'filed', label: 'Filed' },
  { key: 'ein_issued', label: 'EIN issued' },
  { key: 'complete', label: 'Complete' },
];

export default function LlcStepper({ status }: { status: string }) {
  const currentIndex = STEPS.findIndex((s) => s.key === status);

  return (
    <ol className="flex flex-wrap gap-4">
      {STEPS.map((step, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <li key={step.key} className="flex items-center gap-2">
            <span
              className={
                'flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ' +
                (isDone || isCurrent
                  ? 'bg-accent text-accent-ink'
                  : 'border border-border text-ink-muted')
              }
            >
              {i + 1}
            </span>
            <span className={isCurrent ? 'text-sm font-medium' : 'text-sm text-ink-muted'}>
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
