import { db } from '@/lib/db/client';
import { users } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { requireRoleForPage } from '@/lib/auth/guards';
import UserRoleSelect from '@/components/layout/UserRoleSelect';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage() {
  await requireRoleForPage('admin', '/admin/users');

  const allUsers = await db.select().from(users).orderBy(desc(users.createdAt)).limit(200);

  return (
    <main className="min-h-screen bg-[rgb(var(--nr-bg))] text-[rgb(var(--nr-ink))]">
      <div className="max-w-2xl mx-auto px-6 py-12 space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">Users (admin)</h1>

        <ul className="space-y-2">
          {allUsers.map((u) => (
            <li
              key={u.id}
              className="flex items-center justify-between p-3 rounded-lg border border-[rgb(var(--nr-border))] text-sm"
            >
              <div>
                <span className="font-medium">{u.displayName}</span>
                <span className="text-xs text-[rgb(var(--nr-ink-muted))] ml-2">
                  rep {u.reputationScore}
                  {u.isShadowBanned && ' · shadow-banned'}
                </span>
              </div>
              <UserRoleSelect userId={u.id} currentRole={u.role} />
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
