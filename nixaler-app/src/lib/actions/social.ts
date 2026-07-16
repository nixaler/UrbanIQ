'use server';

import { revalidatePath } from 'next/cache';
import { eq, asc } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { contentPosts, postStatusEnum, socialPlatformEnum } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/guards';

export async function listMyPosts() {
  const user = await requireUser();
  return db
    .select()
    .from(contentPosts)
    .where(eq(contentPosts.ownerId, user.id))
    .orderBy(asc(contentPosts.scheduledAt));
}

export async function createPostAction(formData: FormData) {
  const user = await requireUser();
  const caption = String(formData.get('caption') ?? '').trim();
  const platform = String(formData.get('platform') ?? '') as (typeof socialPlatformEnum.enumValues)[number];
  if (!caption || !socialPlatformEnum.enumValues.includes(platform)) return;

  const scheduledAtRaw = String(formData.get('scheduledAt') ?? '');
  const scheduledAt = scheduledAtRaw ? new Date(scheduledAtRaw) : null;

  await db.insert(contentPosts).values({
    ownerId: user.id,
    platform,
    caption,
    mediaUrl: String(formData.get('mediaUrl') ?? '').trim() || null,
    scheduledAt,
    status: scheduledAt ? 'scheduled' : 'draft',
    createdBy: user.id,
  });

  revalidatePath('/dashboard/social');
}

const STATUSES = postStatusEnum.enumValues;

export async function updatePostStatusAction(postId: string, status: (typeof STATUSES)[number]) {
  const user = await requireUser();
  const rows = await db.select().from(contentPosts).where(eq(contentPosts.id, postId)).limit(1);
  if (!rows[0] || rows[0].ownerId !== user.id) return;

  await db.update(contentPosts).set({ status }).where(eq(contentPosts.id, postId));
  revalidatePath('/dashboard/social');
}

export async function deletePostAction(postId: string) {
  const user = await requireUser();
  const rows = await db.select().from(contentPosts).where(eq(contentPosts.id, postId)).limit(1);
  if (!rows[0] || rows[0].ownerId !== user.id) return;

  await db.delete(contentPosts).where(eq(contentPosts.id, postId));
  revalidatePath('/dashboard/social');
}
