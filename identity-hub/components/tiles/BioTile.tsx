'use client';

import Image from 'next/image';
import type { BioConfig } from '@/types/tile';

export default function BioTile({ config }: { config: Record<string, unknown> }) {
  const { name, headline, bio, avatarUrl, links } = config as BioConfig;

  return (
    <div className="tile-shell">
      <div className="tile-header">About</div>
      <div className="tile-body flex gap-4">
        {avatarUrl && (
          <div className="shrink-0">
            <Image
              src={avatarUrl}
              alt={name}
              width={64}
              height={64}
              className="rounded-full"
              style={{ borderRadius: '50%' }}
            />
          </div>
        )}
        <div className="flex flex-col gap-1 min-w-0">
          <p className="font-bold text-lg leading-tight" style={{ color: 'var(--color-text)' }}>
            {name}
          </p>
          <p className="text-sm" style={{ color: 'var(--color-accent)' }}>
            {headline}
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {bio}
          </p>
          {links && links.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {links.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs px-2 py-1 rounded"
                  style={{
                    background: 'var(--color-accent)',
                    color: 'var(--color-accent-fg)',
                    borderRadius: 'var(--tile-radius)',
                  }}
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
