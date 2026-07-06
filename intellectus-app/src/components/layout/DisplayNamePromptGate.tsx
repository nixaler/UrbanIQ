import { getCurrentUserProfile } from '@/lib/auth/session';
import DisplayNamePrompt from './DisplayNamePrompt';

export default async function DisplayNamePromptGate() {
  const viewer = await getCurrentUserProfile();
  if (!viewer || viewer.displayNameSet) return null;

  return <DisplayNamePrompt currentName={viewer.displayName} />;
}
