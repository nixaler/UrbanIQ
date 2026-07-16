import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--nx-bg) / <alpha-value>)',
        'bg-raised': 'rgb(var(--nx-bg-raised) / <alpha-value>)',
        ink: 'rgb(var(--nx-ink) / <alpha-value>)',
        'ink-muted': 'rgb(var(--nx-ink-muted) / <alpha-value>)',
        border: 'rgb(var(--nx-border) / <alpha-value>)',
        accent: 'rgb(var(--nx-accent) / <alpha-value>)',
        'accent-ink': 'rgb(var(--nx-accent-ink) / <alpha-value>)',
        silver: 'rgb(var(--nx-silver) / <alpha-value>)',
      },
      borderRadius: {
        sm: 'var(--nx-radius-sm)',
        md: 'var(--nx-radius-md)',
        lg: 'var(--nx-radius-lg)',
      },
      fontFamily: {
        sans: ['var(--font-nx)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
