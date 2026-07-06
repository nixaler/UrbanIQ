export default function SponsorDisclosureBadge({ companyName, disclosureCopy }: { companyName: string; disclosureCopy: string }) {
  return (
    <div className="text-xs text-[rgb(var(--nr-ink-muted))] border border-[rgb(var(--nr-border))] rounded-md px-2 py-1 inline-block">
      Sponsored by <span className="font-medium text-[rgb(var(--nr-ink))]">{companyName}</span> — {disclosureCopy}
    </div>
  );
}
