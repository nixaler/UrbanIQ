/**
 * C2PA Provenance Tracker (#24): a verified badge on media, to combat
 * deepfakes/AI-generated disinformation, sourced from provenance_records.
 */
export default function ProvenanceBadge({ verified, sourceUrl }: { verified: boolean; sourceUrl: string | null }) {
  return (
    <div className="flex items-center gap-1.5 text-[10px] text-[rgb(var(--nr-ink-muted))]">
      <span
        className={`w-1.5 h-1.5 rounded-full ${verified ? 'bg-[rgb(var(--nr-well-researched))]' : 'bg-[rgb(var(--nr-ink-muted))]'}`}
      />
      {verified ? 'Verified media provenance' : 'Unverified media source'}
      {sourceUrl && (
        <a href={sourceUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">
          source
        </a>
      )}
    </div>
  );
}
