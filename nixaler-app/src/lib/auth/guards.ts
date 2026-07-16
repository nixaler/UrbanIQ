import { redirect } from 'next/navigation';
import { getCurrentUserProfile } from './session';
import type { users } from '@/lib/db/schema';

type UserRow = typeof users.$inferSelect;
type Role = UserRow['role'];

const ROLE_RANK: Record<Role, number> = {
  client: 0,
  coach: 1,
  admin: 2,
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

/**
 * Page-level variants: redirect instead of throwing, so an unauthenticated
 * visitor lands on the sign-in page instead of a raw 500.
 */
export async function requireUserForPage(redirectTo = '/dashboard'): Promise<UserRow> {
  const profile = await getCurrentUserProfile();
  if (!profile) redirect(`/sign-in?redirect=${encodeURIComponent(redirectTo)}`);
  return profile;
}

export async function requireRoleForPage(minRole: Role, redirectTo = '/dashboard'): Promise<UserRow> {
  const profile = await requireUserForPage(redirectTo);
  if (ROLE_RANK[profile.role] < ROLE_RANK[minRole]) redirect('/dashboard');
  return profile;
}
