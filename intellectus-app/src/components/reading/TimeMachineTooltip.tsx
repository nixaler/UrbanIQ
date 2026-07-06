'use client';

import { useState, useRef, useEffect } from 'react';

interface TimeMachineTooltipProps {
  label: string;
  summary: string;
}

/**
 * Contextual Time-Machine Elements (#11): a referenced past event opens an
 * inline micro-summary on click, without navigating away from the article —
 * `references` comes straight from content_blocks.body, no separate fetch.
 */
export default function TimeMachineTooltip({ label, summary }: TimeMachineTooltipProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <span ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="underline decoration-dotted decoration-[rgb(var(--nr-accent))] underline-offset-4 text-[rgb(var(--nr-accent))]"
        aria-expanded={open}
      >
        {label}
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute z-50 left-0 top-full mt-2 w-72 p-4 rounded-lg border border-[rgb(var(--nr-border))] bg-[rgb(var(--nr-bg-raised))] shadow-lg text-sm leading-relaxed font-sans text-[rgb(var(--nr-ink))] normal-case"
        >
          {summary}
        </span>
      )}
    </span>
  );
}
