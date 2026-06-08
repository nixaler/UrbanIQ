'use client';

import Image from 'next/image';
import type { GalleryConfig } from '@/types/tile';

export default function GalleryTile({ config }: { config: Record<string, unknown> }) {
  const { images, columns = 3 } = config as GalleryConfig;

  return (
    <div className="tile-shell">
      <div className="tile-header">Gallery</div>
      <div className="tile-body">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: '8px',
          }}
        >
          {images.map((img, i) => (
            <figure key={i} className="m-0 flex flex-col gap-1">
              <div className="relative w-full aspect-video overflow-hidden" style={{ borderRadius: 'calc(var(--tile-radius) / 2)' }}>
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover"
                />
              </div>
              {img.caption && (
                <figcaption className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
                  {img.caption}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}
