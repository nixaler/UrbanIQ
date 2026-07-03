'use server';

import { db } from '@/lib/db/client';
import { sponsors, topics } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireRole } from '@/lib/auth/guards';

// Sponsored Expert Co-Authorship (#21) — speculative feature; no active
// sponsor pipeline yet, per the confirmed product decision. This is
// editor/admin-only tooling, not a public flow.
export async function createSponsor(params: { companyName: string; contactEmail: string; disclosureCopy: string }) {
  await requireRole('editor');

  const [sponsor] = await db.insert(sponsors).values(params).returning();
  return sponsor;
}

export async function attachSponsorToTopic(params: { topicId: string; sponsorId: string | null }) {
  await requireRole('editor');

  await db.update(topics).set({ sponsorId: params.sponsorId }).where(eq(topics.id, params.topicId));
}
