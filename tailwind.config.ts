import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      colors: {
        ink: {
          950: '#08080f',
          900: '#0d0e1a',
          800: '#15172a',
          700: '#1f2240',
          600: '#2b2f55',
        },
        grade: {
          a: '#34d399',
          b: '#a3e635',
          c: '#fbbf24',
          d: '#fb923c',
          f: '#f87171',
        },
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255,255,255,0.06), 0 24px 70px -28px rgba(99,102,241,0.55)',
      },
    },
  },
  plugins: [],
};

export default config;
