'use client';

import type { Tile, TileType } from '@/types/tile';
import type { ComponentType } from 'react';
import BioTile from './tiles/BioTile';
import GitHubTile from './tiles/GitHubTile';
import GalleryTile from './tiles/GalleryTile';
import MilestoneTile from './tiles/MilestoneTile';

type TileComponent = ComponentType<{ config: Record<string, unknown> }>;

/** Registry: map type strings → components. Add new tile types here only. */
const TILE_REGISTRY: Record<TileType, TileComponent> = {
  bio:       BioTile,
  github:    GitHubTile,
  milestone: MilestoneTile,
  gallery:   GalleryTile,
};

interface Props {
  tile: Tile;
}

export default function TileRenderer({ tile }: Props) {
  const Component = TILE_REGISTRY[tile.type];

  if (!Component) {
    return (
      <div className="tile-shell flex items-center justify-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
        Unknown tile type: <code className="ml-1">{tile.type}</code>
      </div>
    );
  }

  return (
    // Per-tile theme override via data-theme; falls back to parent (dashboard) theme
    <div data-theme={tile.theme} style={{ height: '100%' }}>
      <Component config={tile.config} />
    </div>
  );
}
