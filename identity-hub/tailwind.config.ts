import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  // Disable Tailwind's own dark mode — we control theming via CSS vars + data-theme
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg:      'var(--color-bg)',
        surface: 'var(--color-surface)',
        text:    'var(--color-text)',
        muted:   'var(--color-text-muted)',
        accent:  'var(--color-accent)',
        border:  'var(--color-border)',
      },
      borderRadius: {
        tile: 'var(--tile-radius)',
      },
      boxShadow: {
        tile: 'var(--tile-shadow)',
      },
      fontFamily: {
        theme: 'var(--font-family)',
      },
    },
  },
  plugins: [],
};

export default config;
