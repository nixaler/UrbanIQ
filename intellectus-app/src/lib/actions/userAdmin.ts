'use server';

import { db } from '@/lib/db/client';
import { users, userRoleEnum } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireRole } from '@/lib/auth/guards';

export async function updateUserRole(params: { userId: string; role: (typeof userRoleEnum.enumValues)[number] }) {
  await requireRole('admin');
  await db.update(users).set({ role: params.role }).where(eq(users.id, params.userId));
}
