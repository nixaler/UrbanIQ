import { requireUserForPage } from '@/lib/auth/guards';
import DashboardNav from '@/components/layout/DashboardNav';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUserForPage('/dashboard');

  return (
    <div className="min-h-screen">
      <DashboardNav displayName={user.displayName} />
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
