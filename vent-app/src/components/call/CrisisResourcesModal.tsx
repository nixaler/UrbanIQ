'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { crisisResources, crisisDisclaimer } from '@/lib/config/crisisResources';

interface CrisisResourcesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Reachable from every core-loop screen (topic picker, queue, in-call
// overlay, post-call, footer, bottle recorder) — see the plan's safety
// section. This is the single most important accessibility surface in the
// app, so it uses Radix for real focus-trap/ESC handling rather than a
// hand-rolled modal.
export function CrisisResourcesModal({ open, onOpenChange }: CrisisResourcesModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 w-[90vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-bg-raised p-6 shadow-xl">
          <Dialog.Title className="text-lg font-semibold text-critical">
            We hear you, and you deserve support right now
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-ink-muted">
            {crisisDisclaimer}
          </Dialog.Description>
          <ul className="mt-4 space-y-3">
            {crisisResources.map((resource) => (
              <li key={resource.label}>
                <a
                  href={resource.href}
                  className="block rounded-md border border-border p-3 hover:bg-bg"
                >
                  <div className="font-medium">{resource.label}</div>
                  <div className="text-sm text-ink-muted">{resource.detail}</div>
                </a>
              </li>
            ))}
          </ul>
          <Dialog.Close asChild>
            <button
              type="button"
              className="mt-4 w-full rounded-md border border-border py-2 text-sm text-ink-muted hover:bg-bg"
            >
              Close
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
