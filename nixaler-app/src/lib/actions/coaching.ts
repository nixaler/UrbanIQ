'use server';

import { revalidatePath } from 'next/cache';
import { eq, asc, and } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { curriculumModules, moduleProgress, coachingSessions } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/guards';

export async function listModulesWithProgress() {
  const user = await requireUser();
  const modules = await db.select().from(curriculumModules).orderBy(asc(curriculumModules.order));
  const progress = await db.select().from(moduleProgress).where(eq(moduleProgress.userId, user.id));
  const completedIds = new Set(progress.map((p) => p.moduleId));

  return modules.map((m) => ({ ...m, completed: completedIds.has(m.id) }));
}

export async function markModuleCompleteAction(moduleId: string) {
  const user = await requireUser();
  const existing = await db
    .select()
    .from(moduleProgress)
    .where(and(eq(moduleProgress.userId, user.id), eq(moduleProgress.moduleId, moduleId)))
    .limit(1);
  if (existing[0]) return;

  await db.insert(moduleProgress).values({ userId: user.id, moduleId });
  revalidatePath('/dashboard/coaching');
}

export async function listMySessions() {
  const user = await requireUser();
  return db
    .select()
    .from(coachingSessions)
    .where(eq(coachingSessions.clientId, user.id))
    .orderBy(asc(coachingSessions.requestedAt));
}

export async function requestSessionAction(formData: FormData) {
  const user = await requireUser();
  const notes = String(formData.get('notes') ?? '').trim() || null;

  await db.insert(coachingSessions).values({
    clientId: user.id,
    coachId: user.assignedCoachId,
    notes,
  });

  revalidatePath('/dashboard/coaching');
}
