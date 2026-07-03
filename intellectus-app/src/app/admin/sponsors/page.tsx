import { db } from '@/lib/db/client';
import { sponsors } from '@/lib/db/schema';
import { requireRoleForPage } from '@/lib/auth/guards';
import CreateSponsorForm from '@/components/layout/CreateSponsorForm';

export const dynamic = 'force-dynamic';

export default async function AdminSponsorsPage() {
  await requireRoleForPage('editor');

  const allSponsors = await db.select().from(sponsors);

  return (
    <main className="min-h-screen bg-[rgb(var(--nr-bg))] text-[rgb(var(--nr-ink))]">
      <div className="max-w-2xl mx-auto px-6 py-12 space-y-8">
        <h1 className="text-2xl font-bold tracking-tight">Sponsors (admin)</h1>
        <CreateSponsorForm />

        <ul className="space-y-2">
          {allSponsors.map((sponsor) => (
            <li key={sponsor.id} className="p-3 rounded-lg border border-[rgb(var(--nr-border))] text-sm">
              <span className="font-medium">{sponsor.companyName}</span> — {sponsor.contactEmail}{' '}
              <span className="text-xs text-[rgb(var(--nr-ink-muted))]">
                ({sponsor.active ? 'active' : 'inactive'})
              </span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
