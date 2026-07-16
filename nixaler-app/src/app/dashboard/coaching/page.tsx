import { listModulesWithProgress, listMySessions } from '@/lib/actions/coaching';
import ModuleList from '@/components/coaching/ModuleList';
import SessionRequestForm from '@/components/coaching/SessionRequestForm';

const STATUS_LABEL: Record<string, string> = {
  requested: 'Requested',
  scheduled: 'Scheduled',
  completed: 'Completed',
  canceled: 'Canceled',
};

export default async function CoachingPage() {
  const [modules, sessions] = await Promise.all([listModulesWithProgress(), listMySessions()]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Coaching</h1>
        <p className="mt-1 text-sm text-ink-muted">Sessions with your coach, plus a self-serve curriculum.</p>
      </div>

      <section className="space-y-4">
        <h2 className="font-medium">Sessions</h2>
        <SessionRequestForm />
        {sessions.length > 0 && (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {sessions.map((s) => (
              <li key={s.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-ink-muted">
                  {s.scheduledAt ? new Date(s.scheduledAt).toLocaleString() : `Requested ${new Date(s.requestedAt).toLocaleDateString()}`}
                </span>
                <span className="font-medium">{STATUS_LABEL[s.status]}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-medium">Curriculum</h2>
        <ModuleList modules={modules} />
      </section>
    </div>
  );
}
