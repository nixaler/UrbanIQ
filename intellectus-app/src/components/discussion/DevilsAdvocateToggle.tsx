interface DevilsAdvocateToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/**
 * Devil's Advocate Mode (#5): one anonymous post per user per day, toggled
 * explicitly at compose time rather than a separate "anonymous account" —
 * the eligibility check happens server-side in postComment().
 */
export default function DevilsAdvocateToggle({ checked, onChange }: DevilsAdvocateToggleProps) {
  return (
    <label className="flex items-center gap-2 text-xs text-[rgb(var(--nr-ink-muted))] cursor-pointer select-none">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-[rgb(var(--nr-accent))]"
      />
      Post as Devil's Advocate (anonymous, one per day)
    </label>
  );
}
