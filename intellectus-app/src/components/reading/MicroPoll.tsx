'use client';

import { useState, useTransition } from 'react';
import { castMicroPollVote } from '@/lib/actions/microPolls';

interface MicroPollProps {
  articleId: string;
  positionMarker: string;
  question: string;
  choices: string[];
  initialCounts: Record<string, number>;
  initialChoice: string | null;
}

export default function MicroPoll({ articleId, positionMarker, question, choices, initialCounts, initialChoice }: MicroPollProps) {
  const [counts, setCounts] = useState(initialCounts);
  const [selected, setSelected] = useState(initialChoice);
  const [isPending, startTransition] = useTransition();

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  function vote(choice: string) {
    if (selected === choice) return;
    startTransition(async () => {
      await castMicroPollVote({ articleId, positionMarker, choice });
      setCounts((prev) => {
        const next = { ...prev };
        if (selected) next[selected] = Math.max(0, (next[selected] ?? 0) - 1);
        next[choice] = (next[choice] ?? 0) + 1;
        return next;
      });
      setSelected(choice);
    });
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2 mx-1 align-middle">
      <span className="text-sm text-[rgb(var(--nr-ink-muted))]">{question}</span>
      {choices.map((choice) => {
        const pct = total > 0 ? Math.round(((counts[choice] ?? 0) / total) * 100) : 0;
        return (
          <button
            key={choice}
            disabled={isPending}
            onClick={() => vote(choice)}
            className={`text-xs font-medium px-2 py-0.5 rounded-full border transition-colors ${
              selected === choice
                ? 'border-[rgb(var(--nr-accent))] text-[rgb(var(--nr-accent))]'
                : 'border-[rgb(var(--nr-border))] text-[rgb(var(--nr-ink-muted))] hover:text-[rgb(var(--nr-ink))]'
            }`}
          >
            {choice}
            {selected && ` · ${pct}%`}
          </button>
        );
      })}
    </span>
  );
}
