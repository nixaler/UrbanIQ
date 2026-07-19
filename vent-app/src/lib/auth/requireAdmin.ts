import 'server-only';
import { redirect } from 'next/navigation';
import { getCurrentProfile } from './currentUser';

// Simple allowlist gate — no need for full RBAC at MVP. Set ADMIN_USER_IDS to
// a comma-separated list of Supabase auth user ids.
export async function requireAdmin() {
  const profile = await getCurrentProfile();
  const adminIds = (process.env.ADMIN_USER_IDS ?? '').split(',').map((s) => s.trim()).filter(Boolean);

  if (!profile || !adminIds.includes(profile.id)) {
    redirect('/');
  }

  return profile;
}
