import { createSupabaseServiceRoleClient } from '@/lib/supabase/server';
import { randomUUID } from 'node:crypto';
import type { TtsProvider } from '../provider';

const NARRATIONS_BUCKET = 'narrations';

export class ElevenLabsProvider implements TtsProvider {
  private apiKey: string;

  constructor() {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) throw new Error('ELEVENLABS_API_KEY is not set');
    this.apiKey = apiKey;
  }

  async synthesize(text: string, voiceId: string): Promise<{ audioUrl: string; durationMs: number }> {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, model_id: 'eleven_turbo_v2' }),
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs TTS failed: ${response.status} ${await response.text()}`);
    }

    const audioBuffer = Buffer.from(await response.arrayBuffer());

    // Rough duration estimate; ElevenLabs doesn't return duration directly
    // for the non-streaming endpoint. Good enough for progress-bar UX —
    // swap for a real audio-duration probe if precision becomes necessary.
    const estimatedDurationMs = Math.round((text.split(/\s+/).length / 150) * 60 * 1000);

    const supabase = createSupabaseServiceRoleClient();
    const path = `${randomUUID()}.mp3`;
    const { error } = await supabase.storage.from(NARRATIONS_BUCKET).upload(path, audioBuffer, {
      contentType: 'audio/mpeg',
    });
    if (error) throw new Error(`Failed to upload narration audio: ${error.message}`);

    const { data } = supabase.storage.from(NARRATIONS_BUCKET).getPublicUrl(path);

    return { audioUrl: data.publicUrl, durationMs: estimatedDurationMs };
  }
}
