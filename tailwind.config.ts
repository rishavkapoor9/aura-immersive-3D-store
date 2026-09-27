import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          900: '#08090c',
          800: '#0b0d11',
          700: '#0d1015',
          600: '#12161d',
          500: '#171a20',
          400: '#1d222b',
          300: '#20242b',
        },
        aura: {
          50: '#eaf2fb',
          100: '#cfe8ff',
          200: '#bfe0ff',
          300: '#9fd8ff',
          400: '#7fc4f5',
          500: '#2b85d4',
          600: '#1e6fb8',
        },
        muted: {
          DEFAULT: '#7c8798',
          dim: '#5f6a79',
          faint: '#4d5764',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translate(-50%, 24px)' },
          '100%': { opacity: '1', transform: 'translate(-50%, 0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up .4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
    },
  },
  plugins: [],
} satisfies Config;
