'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function MagicLinkForm({ redirectTo = '/dashboard' }: { redirectTo?: string }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function submit() {
    if (!email.trim()) return;
    setStatus('sending');
    const supabase = createSupabaseBrowserClient();
    const callbackUrl = new URL('/callback', window.location.origin);
    callbackUrl.searchParams.set('next', redirectTo);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: callbackUrl.toString() },
    });
    setStatus(error ? 'error' : 'sent');
  }

  if (status === 'sent') {
    return <p className="text-sm text-ink-muted">Check your email for a sign-in link.</p>;
  }

  return (
    <div className="space-y-3 max-w-sm">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="w-full rounded-md border border-border bg-bg-raised px-3 py-2 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent"
      />
      <button
        onClick={submit}
        disabled={status === 'sending'}
        className="w-full text-sm font-medium px-4 py-2 rounded-md bg-accent text-accent-ink hover:opacity-90 transition disabled:opacity-60"
      >
        {status === 'sending' ? 'Sending…' : 'Send magic link'}
      </button>
      {status === 'error' && <p className="text-xs text-red-500">Something went wrong — try again.</p>}
    </div>
  );
}
