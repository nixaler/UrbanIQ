'use client';

import { useState } from 'react';
import { CrisisResourcesModal } from '@/components/call/CrisisResourcesModal';

export function Footer() {
  const [open, setOpen] = useState(false);

  return (
    <footer className="mx-auto max-w-3xl px-4 py-6 text-sm text-ink-muted">
      <div className="flex flex-wrap items-center gap-4 border-t border-border pt-4">
        <button type="button" onClick={() => setOpen(true)} className="text-critical underline">
          In crisis? Get help now
        </button>
        <span>This is peer support, not therapy or a crisis service.</span>
      </div>
      <CrisisResourcesModal open={open} onOpenChange={setOpen} />
    </footer>
  );
}
