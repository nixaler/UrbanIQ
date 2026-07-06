import Link from 'next/link';
import { getCurrentUserProfile } from '@/lib/auth/session';
import { signOutAction } from '@/lib/actions/auth';

export default async function NavBar() {
  const viewer = await getCurrentUserProfile();

  return (
    <nav className="sticky top-0 z-50 border-b border-[rgb(var(--nr-border))] bg-[rgb(var(--nr-bg))]/90 backdrop-blur-md">
      <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between text-sm">
        <Link href="/" className="font-bold tracking-tight">
          Intellectus
        </Link>

        <div className="flex items-center gap-5 text-[rgb(var(--nr-ink-muted))]">
          <Link href="/vault" className="hover:text-[rgb(var(--nr-ink))]">
            Vault
          </Link>
          <Link href="/guilds" className="hover:text-[rgb(var(--nr-ink))]">
            Guilds
          </Link>
          <Link href="/predictions" className="hover:text-[rgb(var(--nr-ink))]">
            Predictions
          </Link>

          {viewer ? (
            <>
              {viewer.role === 'admin' && (
                <Link href="/admin/users" className="hover:text-[rgb(var(--nr-ink))]">
                  Admin
                </Link>
              )}
              <Link href="/settings/notifications" className="hover:text-[rgb(var(--nr-ink))]">
                {viewer.displayName}
              </Link>
              <form action={signOutAction}>
                <button type="submit" className="hover:text-[rgb(var(--nr-ink))]">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/sign-in"
              className="px-3 py-1.5 rounded-md bg-[rgb(var(--nr-accent))] text-[rgb(var(--nr-accent-ink))] font-medium"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
