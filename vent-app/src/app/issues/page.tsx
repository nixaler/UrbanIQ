import { eq } from 'drizzle-orm';
import { requireConsent } from '@/lib/auth/requireConsent';
import { getCurrentProfile } from '@/lib/auth/currentUser';
import { db } from '@/lib/db/client';
import { issueFollows, issues, topics, aggregateIssueStats } from '@/lib/db/schema';
import { featureFlags } from '@/lib/config/featureFlags';

export default async function IssuesPage() {
  await requireConsent('/issues');
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const followed = await db
    .select({
      issueId: issues.id,
      topicName: topics.name,
      label: issues.label,
      totalFollowers: aggregateIssueStats.totalFollowers,
      totalDonatedCents: aggregateIssueStats.totalDonatedCents,
    })
    .from(issueFollows)
    .innerJoin(issues, eq(issues.id, issueFollows.issueId))
    .innerJoin(topics, eq(topics.id, issues.topicId))
    .leftJoin(aggregateIssueStats, eq(aggregateIssueStats.issueId, issues.id))
    .where(eq(issueFollows.userId, profile.id));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Issues you follow</h1>
      {followed.length === 0 && (
        <p className="text-ink-muted">
          Choose &quot;Follow This Issue&quot; after a call to keep supporting someone&apos;s bigger
          struggle over time.
        </p>
      )}
      <div className="space-y-2">
        {followed.map((issue) => (
          <div key={issue.issueId} className="rounded-md border border-border bg-bg-raised p-4">
            <div className="font-medium">{issue.label ?? issue.topicName}</div>
            {featureFlags.donationsEnabled && (
              <div className="text-sm text-ink-muted">
                ${((issue.totalDonatedCents ?? 0) / 100).toFixed(2)} raised so far
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
