export interface SeedTopic {
  slug: string;
  name: string;
  description: string;
  icon: string;
  sortOrder: number;
}

// MVP categories — seeded by scripts/seed.ts. Adding a new one later is a
// data change (insert into `topics`), not a code change.
export const MVP_TOPICS: SeedTopic[] = [
  {
    slug: 'career-burnout',
    name: 'Career Burnout',
    description: 'Work stress, layoffs, feeling stuck or overwhelmed on the job.',
    icon: 'briefcase',
    sortOrder: 1,
  },
  {
    slug: 'relationship-grief',
    name: 'Relationship Grief',
    description: 'Breakups, family conflict, loneliness, loss.',
    icon: 'heart-crack',
    sortOrder: 2,
  },
  {
    slug: 'financial-stress',
    name: 'Financial Stress',
    description: 'Bills, debt, money anxiety, sudden expenses.',
    icon: 'banknote',
    sortOrder: 3,
  },
  {
    slug: 'climate-anxiety',
    name: 'Climate Anxiety',
    description: 'Worry about the environment and the future.',
    icon: 'cloud-rain',
    sortOrder: 4,
  },
];
