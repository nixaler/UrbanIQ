import { getCurrentUserProfile } from './session';
import type { users } from '@/lib/db/schema';

type UserRow = typeof users.$inferSelect;
type Role = UserRow['role'];

const ROLE_RANK: Record<Role, number> = {
  reader: 0,
  contributor: 1,
  moderator: 2,
  editor: 3,
  admin: 4,
};

export class UnauthorizedError extends Error {
  constructor(message = 'Not signed in') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Insufficient role') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export async function requireUser(): Promise<UserRow> {
  const profile = await getCurrentUserProfile();
  if (!profile) throw new UnauthorizedError();
  return profile;
}

export async function requireRole(minRole: Role): Promise<UserRow> {
  const profile = await requireUser();
  if (ROLE_RANK[profile.role] < ROLE_RANK[minRole]) {
    throw new ForbiddenError(`Requires role >= ${minRole}, has ${profile.role}`);
  }
  return profile;
}
