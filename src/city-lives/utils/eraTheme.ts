export interface EraTheme {
  bg: string;
  accent: string;
  name: string;
  paperBg: string;
  textMuted: string;
}

export function getEraTheme(year: number): EraTheme {
  if (year < 1945) return {
    bg: '#F5F0E8',
    accent: '#8B6914',
    name: 'Depression-Era Crestfield',
    paperBg: '#FDF8F2',
    textMuted: '#7A6A50',
  };
  if (year < 1960) return {
    bg: '#EFF4F9',
    accent: '#1B4F8A',
    name: 'Postwar Crestfield',
    paperBg: '#F6F9FF',
    textMuted: '#4A5E7A',
  };
  if (year < 1975) return {
    bg: '#FEF9F0',
    accent: '#C25010',
    name: 'The Turbulent Years',
    paperBg: '#FFFAF5',
    textMuted: '#7A4A28',
  };
  if (year < 1990) return {
    bg: '#F4F4F4',
    accent: '#374151',
    name: 'Crestfield, Modern',
    paperBg: '#F9F9F9',
    textMuted: '#555',
  };
  if (year < 2005) return {
    bg: '#F9FAFB',
    accent: '#4B5563',
    name: 'Turn of the Century',
    paperBg: '#FAFAFA',
    textMuted: '#666',
  };
  return {
    bg: '#FFFFFF',
    accent: '#111111',
    name: 'Crestfield Today',
    paperBg: '#FFFFFF',
    textMuted: '#555',
  };
}
