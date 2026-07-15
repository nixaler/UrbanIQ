// Optional, self-selected background tags used only as a soft preference
// signal in matching (see src/lib/matching/matcher.ts). Never required,
// never a hard filter.
export const IDENTITY_TAGS = [
  'Student',
  'Parent',
  'Caregiver',
  'LGBTQ+',
  'Veteran',
  'Tech Worker',
  'Healthcare Worker',
  'First-Generation',
  'Immigrant',
  'Retired',
  'Small Business Owner',
  'Recently Unemployed',
] as const;

export type IdentityTag = (typeof IDENTITY_TAGS)[number];
