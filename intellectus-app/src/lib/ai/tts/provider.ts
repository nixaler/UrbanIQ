/**
 * Provider-agnostic TTS interface for Ambient Audio Integration (#19).
 * Decoupled from the text-generation interface (lib/ai/provider.ts) since
 * narration has different latency/cost/licensing characteristics. Default
 * adapter is a synthetic AI voice per the confirmed product decision — no
 * real recorded/cloned human voice.
 */
export interface TtsProvider {
  synthesize(text: string, voiceId: string): Promise<{ audioUrl: string; durationMs: number }>;
}

let cachedProvider: TtsProvider | null = null;

export function getTtsProvider(): TtsProvider {
  if (cachedProvider) return cachedProvider;

  const providerName = process.env.TTS_PROVIDER ?? 'elevenlabs';

  switch (providerName) {
    case 'elevenlabs': {
      const { ElevenLabsProvider } = require('./providers/elevenlabs');
      cachedProvider = new ElevenLabsProvider();
      break;
    }
    default:
      throw new Error(`Unknown TTS_PROVIDER: ${providerName}`);
  }

  return cachedProvider!;
}
