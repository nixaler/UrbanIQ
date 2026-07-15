import 'server-only';
import { redirect } from 'next/navigation';
import { getCurrentProfile, CURRENT_TOS_VERSION } from './currentUser';

// Blocking gate used by every core-loop page (topics, queue, vent, listen,
// bottles). Nothing past /consent is reachable without an accepted,
// current-version ToS + crisis disclaimer.
export async function requireConsent(nextPath: string) {
  const profile = await getCurrentProfile();

  if (!profile || profile.tosVersion !== CURRENT_TOS_VERSION || !profile.tosAcceptedAt) {
    redirect(`/consent?next=${encodeURIComponent(nextPath)}`);
  }

  return profile;
}
