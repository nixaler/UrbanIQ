import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'rgb(var(--nr-bg) / <alpha-value>)',
        'bg-raised': 'rgb(var(--nr-bg-raised) / <alpha-value>)',
        ink: 'rgb(var(--nr-ink) / <alpha-value>)',
        'ink-muted': 'rgb(var(--nr-ink-muted) / <alpha-value>)',
        border: 'rgb(var(--nr-border) / <alpha-value>)',
        accent: 'rgb(var(--nr-accent) / <alpha-value>)',
      },
      borderRadius: {
        sm: 'var(--nr-radius-sm)',
        md: 'var(--nr-radius-md)',
        lg: 'var(--nr-radius-lg)',
      },
    },
  },
  plugins: [],
} satisfies Config;
