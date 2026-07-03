import MagicLinkForm from '@/components/layout/MagicLinkForm';

interface SignInPageProps {
  searchParams: Promise<{ redirect?: string }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { redirect } = await searchParams;

  return (
    <main className="min-h-screen bg-[rgb(var(--nr-bg))] text-[rgb(var(--nr-ink))] flex items-center justify-center">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Sign in to Intellectus</h1>
        <MagicLinkForm redirectTo={redirect ?? '/'} />
      </div>
    </main>
  );
}
