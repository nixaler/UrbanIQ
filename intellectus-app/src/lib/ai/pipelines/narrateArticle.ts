import { db } from '@/lib/db/client';
import { contentBlocks, narrations } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { getTtsProvider } from '@/lib/ai/tts/provider';

const DEFAULT_VOICE_ID = process.env.ELEVENLABS_VOICE_ID ?? 'default';

/**
 * Ambient Audio Integration (#19). Runs once per article per depth level —
 * narration is generated from the same content_blocks the reader sees, so
 * switching depth mid-listen (handled client-side by useAudioSync) always
 * matches what's on screen.
 */
export async function narrateArticleDepth(params: { articleId: string; depthLevel: 'summary' | 'standard' | 'deep' }) {
  const { articleId, depthLevel } = params;

  const blocks = await db
    .select({ body: contentBlocks.body })
    .from(contentBlocks)
    .where(and(eq(contentBlocks.articleId, articleId), eq(contentBlocks.depthLevel, depthLevel)));

  const fullText = blocks
    .map((b) => b.body?.text ?? '')
    .filter(Boolean)
    .join('\n\n');

  if (!fullText.trim()) return null;

  const provider = getTtsProvider();
  const { audioUrl, durationMs } = await provider.synthesize(fullText, DEFAULT_VOICE_ID);

  // Proportional transcript sync: each block gets a time range weighted by
  // its share of total character count. Approximate, but enough to keep
  // playback position roughly aligned with the visible block on screen.
  const totalChars = blocks.reduce((sum, b) => sum + (b.body?.text?.length ?? 0), 0) || 1;
  let cursorMs = 0;
  const transcriptSync = blocks.map((b, idx) => {
    const chars = b.body?.text?.length ?? 0;
    const segmentMs = Math.round((chars / totalChars) * durationMs);
    const start = cursorMs;
    cursorMs += segmentMs;
    return { blockId: String(idx), startMs: start, endMs: cursorMs };
  });

  const [narration] = await db
    .insert(narrations)
    .values({ articleId, depthLevel, audioUrl, voiceId: DEFAULT_VOICE_ID, transcriptSync })
    .returning();

  return narration;
}
