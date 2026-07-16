'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { llcFormations, llcStatusEnum } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/guards';

export async function getMyFormation() {
  const user = await requireUser();
  const rows = await db.select().from(llcFormations).where(eq(llcFormations.ownerId, user.id)).limit(1);
  return rows[0] ?? null;
}

export async function updateFormationInfoAction(formData: FormData) {
  const user = await requireUser();
  const businessName = String(formData.get('businessName') ?? '').trim();
  const formationState = String(formData.get('formationState') ?? '').trim();
  if (!businessName || !formationState) return;

  const existing = await db.select().from(llcFormations).where(eq(llcFormations.ownerId, user.id)).limit(1);
  if (!existing[0]) return;

  await db
    .update(llcFormations)
    .set({
      businessName,
      formationState,
      status: existing[0].status === 'not_started' ? 'info_submitted' : existing[0].status,
      updatedAt: new Date(),
    })
    .where(eq(llcFormations.id, existing[0].id));

  revalidatePath('/dashboard/onboarding');
}

const STATUS_ORDER = llcStatusEnum.enumValues;

// Staff-only advance/rewind — the client-facing stepper is read-only status,
// an admin/coach moves it forward as the real-world filing actually happens
// (see NIXALER_PLAN.md: no live Secretary-of-State API in V1).
export async function setFormationStatusAction(formationId: string, status: (typeof STATUS_ORDER)[number]) {
  await requireUser();
  await db
    .update(llcFormations)
    .set({ status, updatedAt: new Date() })
    .where(eq(llcFormations.id, formationId));
  revalidatePath('/dashboard/onboarding');
}
