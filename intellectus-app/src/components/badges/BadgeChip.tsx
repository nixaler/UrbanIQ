export default function BadgeChip({ label }: { label: string }) {
  return (
    <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[rgb(var(--nr-accent)/0.15)] text-[rgb(var(--nr-accent))] border border-[rgb(var(--nr-accent)/0.3)]">
      {label}
    </span>
  );
}
