export default function DiscussionPromptCard({ promptText }: { promptText: string }) {
  return (
    <blockquote className="p-4 rounded-lg border-l-2 border-[rgb(var(--nr-accent))] bg-[rgb(var(--nr-bg-raised))] text-sm font-serif italic">
      {promptText}
    </blockquote>
  );
}
