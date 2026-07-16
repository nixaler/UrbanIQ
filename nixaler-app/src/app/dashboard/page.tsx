import Link from 'next/link';
import { requireUserForPage } from '@/lib/auth/guards';
import { getMyFormation } from '@/lib/actions/onboarding';
import { listMyContacts } from '@/lib/actions/crm';
import { listMyPosts } from '@/lib/actions/social';
import { listModulesWithProgress } from '@/lib/actions/coaching';

const STATUS_LABEL: Record<string, string> = {
  not_started: 'Not started',
  info_submitted: 'Info submitted',
  filed: 'Filed',
  ein_issued: 'EIN issued',
  complete: 'Complete',
};

export default async function DashboardOverviewPage() {
  const user = await requireUserForPage('/dashboard');
  const [formation, contacts, posts, modules] = await Promise.all([
    getMyFormation(),
    listMyContacts(),
    listMyPosts(),
    listModulesWithProgress(),
  ]);

  const completedModules = modules.filter((m) => m.completed).length;

  const cards = [
    {
      href: '/dashboard/onboarding',
      title: 'LLC & onboarding',
      value: formation ? STATUS_LABEL[formation.status] : 'Not started',
    },
    { href: '/dashboard/crm', title: 'CRM contacts', value: String(contacts.length) },
    { href: '/dashboard/social', title: 'Content posts', value: String(posts.length) },
    {
      href: '/dashboard/coaching',
      title: 'Curriculum progress',
      value: `${completedModules}/${modules.length} modules`,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {user.displayName}</h1>
        <p className="mt-1 text-sm text-ink-muted">Here&apos;s where your business stands today.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="rounded-lg border border-border bg-bg-raised p-5 transition hover:border-accent/40"
          >
            <p className="text-sm text-ink-muted">{c.title}</p>
            <p className="mt-2 text-xl font-semibold">{c.value}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
