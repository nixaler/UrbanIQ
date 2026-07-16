'use server';

import { revalidatePath } from 'next/cache';
import { eq, desc } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { crmContacts, crmStageEnum } from '@/lib/db/schema';
import { requireUser } from '@/lib/auth/guards';

export async function listMyContacts() {
  const user = await requireUser();
  return db
    .select()
    .from(crmContacts)
    .where(eq(crmContacts.ownerId, user.id))
    .orderBy(desc(crmContacts.updatedAt));
}

export async function createContactAction(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get('name') ?? '').trim();
  if (!name) return;

  await db.insert(crmContacts).values({
    ownerId: user.id,
    name,
    email: String(formData.get('email') ?? '').trim() || null,
    phone: String(formData.get('phone') ?? '').trim() || null,
    company: String(formData.get('company') ?? '').trim() || null,
    notes: String(formData.get('notes') ?? '').trim() || null,
  });

  revalidatePath('/dashboard/crm');
}

const STAGES = crmStageEnum.enumValues;

export async function updateContactStageAction(contactId: string, stage: (typeof STAGES)[number]) {
  const user = await requireUser();
  const rows = await db.select().from(crmContacts).where(eq(crmContacts.id, contactId)).limit(1);
  if (!rows[0] || rows[0].ownerId !== user.id) return;

  await db
    .update(crmContacts)
    .set({ stage, updatedAt: new Date() })
    .where(eq(crmContacts.id, contactId));

  revalidatePath('/dashboard/crm');
}

export async function deleteContactAction(contactId: string) {
  const user = await requireUser();
  const rows = await db.select().from(crmContacts).where(eq(crmContacts.id, contactId)).limit(1);
  if (!rows[0] || rows[0].ownerId !== user.id) return;

  await db.delete(crmContacts).where(eq(crmContacts.id, contactId));
  revalidatePath('/dashboard/crm');
}
