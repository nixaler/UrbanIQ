import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import { db } from '@/lib/db/client';
import { reports } from '@/lib/db/schema';
import { ReportActions } from '@/components/admin/ReportActions';

export default async function ReportDetailPage({ params }: { params: Promise<{ reportId: string }> }) {
  await requireAdmin();
  const { reportId } = await params;

  const [report] = await db.select().from(reports).where(eq(reports.id, reportId)).limit(1);
  if (!report) notFound();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Report detail</h1>
      <div className="space-y-1 rounded-md border border-border bg-bg-raised p-4 text-sm">
        <div>
          <strong>Reason:</strong> {report.reasonCode}
        </div>
        <div>
          <strong>Severity:</strong> {report.severity}
        </div>
        <div>
          <strong>Status:</strong> {report.status}
        </div>
        <div>
          <strong>Session:</strong> {report.sessionId}
        </div>
        <div>
          <strong>Reported user:</strong> {report.reportedUserId}
        </div>
        {report.note && (
          <div>
            <strong>Note:</strong> {report.note}
          </div>
        )}
      </div>
      <ReportActions reportId={report.id} />
    </div>
  );
}
