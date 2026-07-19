import { requireConsent } from '@/lib/auth/requireConsent';
import { ListenerAcademyQuiz } from '@/components/onboarding/ListenerAcademyQuiz';

export default async function ListenerAcademyPage() {
  await requireConsent('/listener-academy');

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Listener Academy</h1>
      <p className="text-ink-muted">
        Empathy is a skill. This quick check makes sure every listener knows the basics before
        their first call.
      </p>
      <ListenerAcademyQuiz />
    </div>
  );
}
