export type TileType = 'bio' | 'github' | 'milestone' | 'gallery';
export type ThemeName = 'light' | 'dark' | 'myspace-retro';

export interface TilePos {
  /** Column index (0-based) */
  x: number;
  /** Row index (0-based) */
  y: number;
  /** Width in grid columns */
  w: number;
  /** Height in grid rows */
  h: number;
}

export interface Tile {
  id: string;
  type: TileType;
  /** Tile-specific configuration — shape varies per TileType */
  config: Record<string, unknown>;
  pos: TilePos;
  /** Per-tile theme override; falls back to global dashboard theme */
  theme: ThemeName;
}

// ---- Config shapes for each tile type ----

export interface BioConfig {
  name: string;
  headline: string;
  bio: string;
  avatarUrl?: string;
  links?: { label: string; href: string }[];
}

export interface GitHubConfig {
  username: string;
  showPinnedRepos?: boolean;
  showContribGraph?: boolean;
}

export interface MilestoneConfig {
  title: string;
  items: { label: string; date: string; done: boolean }[];
}

export interface GalleryConfig {
  images: { src: string; alt: string; caption?: string }[];
  columns?: number;
}
