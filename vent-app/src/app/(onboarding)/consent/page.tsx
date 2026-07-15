import { redirect } from 'next/navigation';
import { getCurrentProfile, CURRENT_TOS_VERSION } from '@/lib/auth/currentUser';
import { ConsentGate } from '@/components/onboarding/ConsentGate';

export default async function ConsentPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const nextPath = next && next.startsWith('/') ? next : '/topics';

  const profile = await getCurrentProfile();
  if (profile && profile.tosVersion === CURRENT_TOS_VERSION && profile.tosAcceptedAt) {
    redirect(nextPath);
  }

  return <ConsentGate nextPath={nextPath} />;
}
