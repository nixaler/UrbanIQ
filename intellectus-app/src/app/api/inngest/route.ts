import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';
import { contentPipeline } from '@/lib/inngest/functions/contentPipeline';
import { streakReset } from '@/lib/inngest/functions/streakReset';
import { notificationDispatch } from '@/lib/inngest/functions/notificationDispatch';
import { dailyDigest } from '@/lib/inngest/functions/dailyDigest';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [contentPipeline, streakReset, notificationDispatch, dailyDigest],
});
