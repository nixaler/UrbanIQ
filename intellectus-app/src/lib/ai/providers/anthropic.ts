import Anthropic from '@anthropic-ai/sdk';
import type { ZodSchema } from 'zod';
import type { AiTextProvider } from '../provider';

export class AnthropicProvider implements AiTextProvider {
  private client: Anthropic;
  private model: string;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');

    const model = process.env.ANTHROPIC_MODEL;
    if (!model) throw new Error('ANTHROPIC_MODEL is not set — pick a current Claude model id');

    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async generateText(prompt: string, opts?: { system?: string; maxTokens?: number }): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: opts?.maxTokens ?? 2048,
      system: opts?.system,
      messages: [{ role: 'user', content: prompt }],
    });

    const textBlock = response.content.find((block) => block.type === 'text');
    return textBlock && textBlock.type === 'text' ? textBlock.text : '';
  }

  /**
   * Batches a structured, schema-validated generation into a single call
   * rather than looping per-block — this is what keeps the Atomic Object
   * pipeline (12-15 block variants per article) to one round trip instead
   * of 12-15, avoiding the latency/drop-rate problem of sequential calls.
   */
  async generateStructured<T>(params: {
    prompt: string;
    system?: string;
    schema: ZodSchema<T>;
    maxTokens?: number;
  }): Promise<T> {
    const raw = await this.generateText(
      `${params.prompt}\n\nRespond with ONLY a single valid JSON value matching the requested shape — no prose, no markdown fences.`,
      { system: params.system, maxTokens: params.maxTokens ?? 8192 },
    );

    const parsed = JSON.parse(stripCodeFence(raw));
    return params.schema.parse(parsed);
  }
}

function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return fenced?.[1] ?? trimmed;
}
