import Link from 'next/link';
import MagicLinkForm from '@/components/layout/MagicLinkForm';

interface SignInPageProps {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { redirect } = await searchParams;

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1">
          <Link href="/" className="text-sm text-ink-muted hover:text-ink">
            ← niXaler
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="text-sm text-ink-muted">We&apos;ll email you a one-time link — no password needed.</p>
        </div>
        <MagicLinkForm redirectTo={redirect ?? '/dashboard'} />
      </div>
    </main>
  );
}
