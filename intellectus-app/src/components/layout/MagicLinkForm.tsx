'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';

export default function MagicLinkForm({ redirectTo = '/' }: { redirectTo?: string }) {
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
    return <p className="text-sm text-[rgb(var(--nr-ink-muted))]">Check your email for a sign-in link.</p>;
  }

  return (
    <div className="space-y-2 max-w-sm">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="w-full rounded-md border border-[rgb(var(--nr-border))] bg-[rgb(var(--nr-bg-raised))] px-3 py-2 text-sm"
      />
      <button
        onClick={submit}
        disabled={status === 'sending'}
        className="text-xs font-medium px-3 py-1.5 rounded-md bg-[rgb(var(--nr-accent))] text-[rgb(var(--nr-accent-ink))]"
      >
        {status === 'sending' ? 'Sending…' : 'Send magic link'}
      </button>
      {status === 'error' && <p className="text-xs text-[rgb(var(--nr-agree))]">Something went wrong — try again.</p>}
    </div>
  );
}
