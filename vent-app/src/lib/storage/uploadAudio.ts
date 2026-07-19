import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';

const BUCKET = 'vent-audio';

// Bottles and replies are recorded async (not live like the Daily calls), so
// they need somewhere to live between recording and playback. Supabase
// Storage keeps this in the same project as everything else rather than
// standing up a separate blob store.
export async function uploadAudio(path: string, file: Blob): Promise<string> {
  const admin = createAdminClient();
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await admin.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type || 'audio/webm',
    upsert: false,
  });
  if (error) throw new Error(`Audio upload failed: ${error.message}`);

  const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
