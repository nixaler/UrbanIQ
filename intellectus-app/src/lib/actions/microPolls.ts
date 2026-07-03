'use server';

import { db } from '@/lib/db/client';
import { microPollResponses } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/guards';

/**
 * Frictionless Micro-Forms (#20): logged inline, at the position marker
 * where the poll appears inside content_blocks.body — not a bottom-of-page
 * widget.
 */
export async function castMicroPollVote(params: { articleId: string; positionMarker: string; choice: string }) {
  const user = await requireUser();

  await db
    .insert(microPollResponses)
    .values({ articleId: params.articleId, positionMarker: params.positionMarker, choice: params.choice, userId: user.id })
    .onConflictDoUpdate({
      target: [microPollResponses.articleId, microPollResponses.positionMarker, microPollResponses.userId],
      set: { choice: params.choice },
    });
}
