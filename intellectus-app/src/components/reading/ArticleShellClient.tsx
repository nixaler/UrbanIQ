'use client';

import { useDepthPreference, type DepthLevel } from '@/hooks/useDepthPreference';
import ProvenanceBadge from '@/components/badges/ProvenanceBadge';
import MicroPoll from './MicroPoll';

type BlockType = 'event' | 'backstory' | 'visual_data' | 'global_impact' | 'primary_source';

interface ClientBlock {
  id: string;
  type: BlockType;
  depth: DepthLevel;
  content: {
    text?: string;
    markdown?: string;
    metrics?: { label: string; value: string }[];
    list?: string[];
    media?: { url: string; alt: string };
    poll?: { positionMarker: string; question: string; choices: string[] };
  };
  provenance?: { verified: boolean; sourceUrl: string | null } | null;
  pollData?: { counts: Record<string, number>; viewerChoice: string | null };
}

interface ArticleShellClientProps {
  articleId: string;
  initialBlocks: ClientBlock[];
}

const DEPTH_LABEL: Record<DepthLevel, string> = {
  summary: '1-Min',
  standard: '3-Min',
  deep: 'Deep Dive',
};

export default function ArticleShellClient({ articleId, initialBlocks }: ArticleShellClientProps) {
  const { currentDepth, setDepth } = useDepthPreference();

  const visibleBlocks = initialBlocks.filter((block) => block.depth === currentDepth);

  return (
    <div className="space-y-8">
      <div className="flex p-1 bg-[rgb(var(--nr-bg-raised))] rounded-lg border border-[rgb(var(--nr-border))] max-w-sm sticky top-4 backdrop-blur-md bg-opacity-80 z-40">
        {(Object.keys(DEPTH_LABEL) as DepthLevel[]).map((depth) => (
          <button
            key={depth}
            onClick={() => setDepth(depth)}
            className={`flex-1 text-xs font-medium py-2 rounded-md capitalize transition-all duration-200 ${
              currentDepth === depth
                ? 'bg-[rgb(var(--nr-accent))] text-[rgb(var(--nr-accent-ink))] shadow-sm'
                : 'text-[rgb(var(--nr-ink-muted))] hover:text-[rgb(var(--nr-ink))]'
            }`}
          >
            {DEPTH_LABEL[depth]}
          </button>
        ))}
      </div>

      <article className="space-y-6 transition-all duration-300">
        {visibleBlocks.map((block) => (
          <div
            key={block.id}
            className="p-6 bg-[rgb(var(--nr-bg-raised))] rounded-xl border border-[rgb(var(--nr-border))] hover:border-[rgb(var(--nr-accent)/0.4)] transition-colors duration-200"
          >
            <span className="text-[10px] font-mono text-[rgb(var(--nr-ink-muted))] uppercase tracking-wider block mb-2">
              {block.type.replace('_', ' ')}
            </span>

            {block.content.media && (
              <div className="mb-3 space-y-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={block.content.media.url} alt={block.content.media.alt} className="w-full rounded-lg" />
                <ProvenanceBadge verified={block.provenance?.verified ?? false} sourceUrl={block.provenance?.sourceUrl ?? null} />
              </div>
            )}

            {block.content.text && (
              <p className="leading-relaxed text-base font-serif">{block.content.text}</p>
            )}

            {block.content.poll && (
              <div className="mt-3">
                <MicroPoll
                  articleId={articleId}
                  positionMarker={block.content.poll.positionMarker}
                  question={block.content.poll.question}
                  choices={block.content.poll.choices}
                  initialCounts={block.pollData?.counts ?? {}}
                  initialChoice={block.pollData?.viewerChoice ?? null}
                />
              </div>
            )}

            {block.content.list && (
              <ul className="list-disc list-inside space-y-2 font-serif">
                {block.content.list.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            )}

            {block.content.metrics && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                {block.content.metrics.map((metric, idx) => (
                  <div
                    key={idx}
                    className="bg-[rgb(var(--nr-bg))] p-3 rounded-lg border border-[rgb(var(--nr-border))]"
                  >
                    <div className="text-xs text-[rgb(var(--nr-ink-muted))] font-medium">{metric.label}</div>
                    <div className="text-lg font-bold font-mono text-[rgb(var(--nr-accent))] mt-0.5">
                      {metric.value}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </article>
    </div>
  );
}
