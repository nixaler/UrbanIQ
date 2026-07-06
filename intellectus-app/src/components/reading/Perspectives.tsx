'use client';

import { useState } from 'react';

interface Perspective {
  id: string;
  factionName: string;
  stanceSummary: string;
  argumentBody: string;
  sourceUrl: string | null;
}

/**
 * Multi-Perspective Feeds (#9): factions are shown as swipeable cards on
 * narrow viewports and a split view on wide ones — same data, no separate
 * mobile/desktop component.
 */
export default function Perspectives({ perspectives }: { perspectives: Perspective[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  if (perspectives.length === 0) return null;

  return (
    <section aria-label="Multiple perspectives on this story" className="space-y-3">
      <h2 className="text-xs uppercase tracking-widest text-[rgb(var(--nr-ink-muted))] font-semibold">
        How different perspectives see it
      </h2>

      {/* Split view: all factions side by side, wide viewports only. */}
      <div className="hidden md:grid gap-4" style={{ gridTemplateColumns: `repeat(${perspectives.length}, minmax(0, 1fr))` }}>
        {perspectives.map((p) => (
          <PerspectiveCard key={p.id} perspective={p} />
        ))}
      </div>

      {/* Swipeable view: one faction at a time, narrow viewports. */}
      <div className="md:hidden">
        <PerspectiveCard perspective={perspectives[activeIndex]!} />
        <div className="flex justify-center gap-2 pt-3">
          {perspectives.map((p, idx) => (
            <button
              key={p.id}
              aria-label={`Show ${p.factionName} perspective`}
              onClick={() => setActiveIndex(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === activeIndex ? 'w-6 bg-[rgb(var(--nr-accent))]' : 'w-1.5 bg-[rgb(var(--nr-border))]'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function PerspectiveCard({ perspective }: { perspective: Perspective }) {
  return (
    <div className="p-5 rounded-xl border border-[rgb(var(--nr-border))] bg-[rgb(var(--nr-bg-raised))] h-full">
      <span className="text-xs font-semibold text-[rgb(var(--nr-accent))] uppercase tracking-wide">
        {perspective.factionName}
      </span>
      <p className="text-sm font-medium mt-1">{perspective.stanceSummary}</p>
      <p className="text-sm text-[rgb(var(--nr-ink-muted))] mt-2 leading-relaxed font-serif">
        {perspective.argumentBody}
      </p>
      {perspective.sourceUrl && (
        <a
          href={perspective.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-[rgb(var(--nr-accent))] underline underline-offset-2 mt-3 inline-block"
        >
          Source
        </a>
      )}
    </div>
  );
}
