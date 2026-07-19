import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--vent-bg) / <alpha-value>)',
        'bg-raised': 'rgb(var(--vent-bg-raised) / <alpha-value>)',
        ink: 'rgb(var(--vent-ink) / <alpha-value>)',
        'ink-muted': 'rgb(var(--vent-ink-muted) / <alpha-value>)',
        border: 'rgb(var(--vent-border) / <alpha-value>)',
        accent: 'rgb(var(--vent-accent) / <alpha-value>)',
        critical: 'rgb(var(--vent-critical) / <alpha-value>)',
      },
      borderRadius: {
        sm: 'var(--vent-radius-sm)',
        md: 'var(--vent-radius-md)',
        lg: 'var(--vent-radius-lg)',
      },
    },
  },
  plugins: [],
} satisfies Config;
