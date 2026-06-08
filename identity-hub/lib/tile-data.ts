import type { Tile } from '@/types/tile';

/** Default tile layout — replace with DB/CMS fetch in production */
export const DEFAULT_TILES: Tile[] = [
  {
    id: 'bio-1',
    type: 'bio',
    theme: 'light',
    pos: { x: 0, y: 0, w: 4, h: 3 },
    config: {
      name: 'Jane Doe',
      headline: 'Full-Stack Engineer & Open Source Contributor',
      bio: 'Building things on the web. Passionate about developer tooling, distributed systems, and great UX.',
      avatarUrl: 'https://avatars.githubusercontent.com/u/583231',
      links: [
        { label: 'GitHub', href: 'https://github.com' },
        { label: 'Twitter', href: 'https://twitter.com' },
      ],
    },
  },
  {
    id: 'github-1',
    type: 'github',
    theme: 'light',
    pos: { x: 4, y: 0, w: 8, h: 3 },
    config: {
      username: 'octocat',
      showPinnedRepos: true,
      showContribGraph: false,
    },
  },
  {
    id: 'milestone-1',
    type: 'milestone',
    theme: 'light',
    pos: { x: 0, y: 3, w: 6, h: 4 },
    config: {
      title: '2024 Goals',
      items: [
        { label: 'Launch MVP', date: '2024-03-01', done: true },
        { label: 'Reach 1k GitHub stars', date: '2024-06-01', done: false },
        { label: 'Write 12 blog posts', date: '2024-12-31', done: false },
      ],
    },
  },
  {
    id: 'gallery-1',
    type: 'gallery',
    theme: 'light',
    pos: { x: 6, y: 3, w: 6, h: 4 },
    config: {
      columns: 3,
      images: [
        { src: 'https://picsum.photos/seed/a/400/300', alt: 'Project alpha', caption: 'Alpha launch' },
        { src: 'https://picsum.photos/seed/b/400/300', alt: 'Project beta', caption: 'Beta testing' },
        { src: 'https://picsum.photos/seed/c/400/300', alt: 'Project gamma', caption: 'Shipped!' },
      ],
    },
  },
];
