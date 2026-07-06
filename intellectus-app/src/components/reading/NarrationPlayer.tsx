'use client';

import { useAudioSync } from '@/hooks/useAudioSync';
import type { DepthLevel } from '@/hooks/useDepthPreference';

interface NarrationPlayerProps {
  narrationsByDepth: Partial<Record<DepthLevel, { audioUrl: string; durationMs: number }>>;
}

export default function NarrationPlayer({ narrationsByDepth }: NarrationPlayerProps) {
  const { audioRef } = useAudioSync(narrationsByDepth);

  if (Object.keys(narrationsByDepth).length === 0) return null;

  return (
    <div className="sticky bottom-4 z-40 flex justify-center pt-4">
      <div className="flex items-center gap-2 px-3 py-2 rounded-full border border-[rgb(var(--nr-border))] bg-[rgb(var(--nr-bg-raised))] shadow-lg">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <audio ref={audioRef} controls className="h-8" />
        <span className="text-[10px] text-[rgb(var(--nr-ink-muted))] pr-1">AI narration</span>
      </div>
    </div>
  );
}
