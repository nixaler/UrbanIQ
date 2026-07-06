'use client';

import { useEffect, useRef } from 'react';
import { useDepthPreference, type DepthLevel } from './useDepthPreference';

interface Narration {
  audioUrl: string;
  durationMs: number;
}

/**
 * Ambient Audio Integration (#19): "seamlessly switch between reading and
 * listening while maintaining their exact place." When the depth toggle
 * changes, this computes the fractional position in the old track and
 * carries it over to the new one, rather than restarting from zero.
 */
export function useAudioSync(narrationsByDepth: Partial<Record<DepthLevel, Narration>>) {
  const { currentDepth } = useDepthPreference();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevDepthRef = useRef<DepthLevel>(currentDepth);

  useEffect(() => {
    const audio = audioRef.current;
    const narration = narrationsByDepth[currentDepth];
    if (!audio || !narration || audio.src === narration.audioUrl) {
      prevDepthRef.current = currentDepth;
      return;
    }

    const prevNarration = narrationsByDepth[prevDepthRef.current];
    const wasPlaying = !audio.paused;
    let resumeAtSeconds = 0;

    if (prevNarration && audio.duration > 0) {
      const fraction = audio.currentTime / audio.duration;
      resumeAtSeconds = fraction * (narration.durationMs / 1000);
    }

    audio.src = narration.audioUrl;
    audio.currentTime = resumeAtSeconds;
    if (wasPlaying) void audio.play();

    prevDepthRef.current = currentDepth;
  }, [currentDepth, narrationsByDepth]);

  return { audioRef };
}
