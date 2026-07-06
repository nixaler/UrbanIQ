interface EditorInfo {
  displayName: string;
  avatarUrl: string | null;
  role: string;
}

/**
 * Human-in-the-Loop Badging (#10): audiences are fatigued by anonymous
 * AI-drafted content — this puts a real name and face on the byline instead
 * of hiding the human editorial step.
 */
export default function EditorCredentialCard({ editor }: { editor: EditorInfo | null }) {
  if (!editor) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-[rgb(var(--nr-ink-muted))]">
      {editor.avatarUrl ? (
        <img src={editor.avatarUrl} alt={editor.displayName} className="w-6 h-6 rounded-full object-cover" />
      ) : (
        <span className="w-6 h-6 rounded-full bg-[rgb(var(--nr-accent)/0.25)] flex items-center justify-center text-[rgb(var(--nr-accent))] font-semibold">
          {editor.displayName.charAt(0)}
        </span>
      )}
      <span>
        Curated by <span className="text-[rgb(var(--nr-ink))] font-medium">{editor.displayName}</span>
      </span>
    </div>
  );
}
