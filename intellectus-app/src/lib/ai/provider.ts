import type { ZodSchema } from 'zod';

/**
 * Provider-agnostic AI text interface. Every text-generation feature in the
 * plan (Discussion Prompts #2, Atomic Object drafting #8, editor summaries
 * #10, the Weekend Vault digest #15) routes through this single interface,
 * not through a provider SDK directly — swapping models or adding a
 * guardrail pass happens here once, not per-feature.
 *
 * Default adapter is Claude (see providers/anthropic.ts). Select a different
 * adapter via the AI_PROVIDER env var without touching call sites.
 */
export interface AiTextProvider {
  generateText(prompt: string, opts?: { system?: string; maxTokens?: number }): Promise<string>;
  generateStructured<T>(params: {
    prompt: string;
    system?: string;
    schema: ZodSchema<T>;
    maxTokens?: number;
  }): Promise<T>;
}

let cachedProvider: AiTextProvider | null = null;

export function getAiProvider(): AiTextProvider {
  if (cachedProvider) return cachedProvider;

  const providerName = process.env.AI_PROVIDER ?? 'anthropic';

  switch (providerName) {
    case 'anthropic': {
      // Lazy import so unrelated routes don't pay for the SDK unless used.
      const { AnthropicProvider } = require('./providers/anthropic');
      cachedProvider = new AnthropicProvider();
      break;
    }
    default:
      throw new Error(`Unknown AI_PROVIDER: ${providerName}`);
  }

  return cachedProvider!;
}
