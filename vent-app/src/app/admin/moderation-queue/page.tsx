import Link from 'next/link';
import { desc } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { db } from '@/lib/db/client';
import { reports } from '@/lib/db/schema';

const SEVERITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export default async function ModerationQueuePage() {
  await requireAdmin();

  const openReports = await db.select().from(reports).orderBy(desc(reports.createdAt));
  const sorted = [...openReports].sort(
    (a, b) =>
      (SEVERITY_ORDER[a.severity] ?? 99) - (SEVERITY_ORDER[b.severity] ?? 99) ||
      b.createdAt.getTime() - a.createdAt.getTime()
  );

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Moderation queue</h1>
      <div className="space-y-2">
        {sorted.map((report) => (
          <Link
            key={report.id}
            href={`/admin/moderation-queue/${report.id}`}
            className={`block rounded-md border p-3 text-sm ${
              report.severity === 'critical' ? 'border-critical bg-critical/10' : 'border-border bg-bg-raised'
            }`}
          >
            <div className="flex justify-between">
              <span className="font-medium">{report.reasonCode}</span>
              <span className="uppercase text-xs text-ink-muted">{report.severity} · {report.status}</span>
            </div>
            <div className="text-ink-muted">{report.createdAt.toLocaleString()}</div>
          </Link>
        ))}
        {sorted.length === 0 && <p className="text-ink-muted">No reports.</p>}
      </div>
    </div>
  );
}
