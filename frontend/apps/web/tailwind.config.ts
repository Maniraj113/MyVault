import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          50: '#f6f9fc',
          100: '#eef3f8',
        },
        primary: {
          DEFAULT: '#0b5ed7',
          50: '#e7f0ff',
          100: '#d2e1ff',
          200: '#a6c3ff',
          300: '#79a4ff',
          400: '#4d86ff',
          500: '#2067ff',
          600: '#0b5ed7',
          700: '#0a4cad',
          800: '#083a83',
          900: '#062859'
        }
      },
      boxShadow: {
        card: '0 4px 24px rgba(0,0,0,0.06)'
      },
      borderRadius: {
        xl: '1rem'
      }
    }
  },
  plugins: []
} satisfies Config;


