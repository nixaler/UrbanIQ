'use client';

import { useState } from 'react';
import type { Category } from '@/types/confession';
import { CATEGORY_META } from '@/types/confession';

const MAX = 500;
const CATEGORIES = Object.entries(CATEGORY_META) as [Category, typeof CATEGORY_META[Category]][];

interface Props {
  onClose: () => void;
}

export default function SubmitDrawer({ onClose }: Props) {
  const [content,    setContent]    = useState('');
  const [category,   setCategory]   = useState<Category>('confession');
  const [submitting, setSubmitting] = useState(false);
  const [done,       setDone]       = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  async function handleSubmit() {
    const text = content.trim();
    if (text.length < 10) { setError('Too short — minimum 10 characters.'); return; }
    setSubmitting(true);
    setError(null);

    const res = await fetch('/api/confessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text, category }),
    });

    setSubmitting(false);
    if (res.ok) {
      setDone(true);
      setTimeout(onClose, 1200);
    } else {
      const body = await res.json().catch(() => ({}));
      setError((body as { error?: string }).error ?? 'Something went wrong.');
    }
  }

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer">
        {done ? (
          <div className="text-center py-6">
            <p className="text-3xl mb-2">✅</p>
            <p style={{ color: 'var(--color-text)' }}>Posted anonymously.</p>
          </div>
        ) : (
          <>
            <h2 className="text-base font-bold mb-4" style={{ color: 'var(--color-text)' }}>
              Blurt it out
            </h2>

            {/* Category picker */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {CATEGORIES.map(([value, meta]) => (
                <button
                  key={value}
                  onClick={() => setCategory(value)}
                  className="px-3 py-1 text-xs rounded-full transition-all"
                  style={{
                    background:  category === value ? meta.bg : 'var(--color-surface-2)',
                    color:       category === value ? meta.color : 'var(--color-text-muted)',
                    border:      `1px solid ${category === value ? meta.color : 'var(--color-border)'}`,
                  }}
                >
                  {meta.label}
                </button>
              ))}
            </div>

            {/* Text area */}
            <div className="relative mb-2">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, MAX))}
                rows={4}
                placeholder="What's on your mind?"
                className="w-full rounded-xl p-3 text-sm resize-none outline-none focus:ring-1"
                style={{
                  background:  'var(--color-surface-2)',
                  border:      '1px solid var(--color-border)',
                  color:       'var(--color-text)',
                  borderRadius:'var(--tile-radius)',
                  boxShadow:   'none',
                }}
              />
              <span
                className="absolute bottom-3 right-3 text-xs"
                style={{ color: content.length > MAX * 0.9 ? '#f87171' : 'var(--color-text-muted)' }}
              >
                {content.length}/{MAX}
              </span>
            </div>

            {error && (
              <p className="text-xs mb-2" style={{ color: '#f87171' }}>{error}</p>
            )}

            <p className="text-xs mb-4" style={{ color: 'var(--color-text-muted)' }}>
              🔒 Your identity is never recorded.
            </p>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="flex-1 py-2 rounded-xl text-sm"
                style={{
                  background: 'var(--color-surface-2)',
                  color:      'var(--color-text-muted)',
                  border:     '1px solid var(--color-border)',
                  borderRadius: 'var(--tile-radius)',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || content.trim().length < 10}
                className="flex-1 py-2 rounded-xl text-sm font-semibold transition-opacity disabled:opacity-40"
                style={{
                  background:   'var(--color-accent)',
                  color:        'var(--color-accent-fg)',
                  borderRadius: 'var(--tile-radius)',
                }}
              >
                {submitting ? 'Posting…' : 'Post anonymously'}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
