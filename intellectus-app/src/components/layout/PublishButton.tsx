'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { publishArticle } from '@/lib/actions/articles';

export default function PublishButton({ articleId }: { articleId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await publishArticle(articleId);
          router.refresh();
        })
      }
      className="text-xs font-medium px-3 py-1.5 rounded-md bg-[rgb(var(--nr-accent))] text-[rgb(var(--nr-accent-ink))]"
    >
      {isPending ? 'Publishing…' : 'Publish'}
    </button>
  );
}
