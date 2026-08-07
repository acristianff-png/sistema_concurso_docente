import type { Config } from 'tailwindcss'

/**
 * Tokens de marca AM Mentoria.
 * Fonte da verdade também em src/styles/tokens.css (CSS custom properties),
 * usadas fora do Tailwind (ex.: SVG masks, gradientes inline).
 * Ajustar os dois arquivos juntos ao mudar a paleta.
 */
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'teal-dark': '#0B3B32',
        coral: {
          DEFAULT: '#D2551F',
          dark: '#A8410F',
        },
        paper: '#F1F3EE',
        mustard: '#F4C430',
        ink: '#14201C',
      },
      fontFamily: {
        display: ['Fraunces', 'ui-serif', 'Georgia', 'serif'],
        mono: ['"Space Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        sans: ['"Work Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'dashed-v': 'repeating-linear-gradient(to bottom, currentColor 0, currentColor 6px, transparent 6px, transparent 14px)',
      },
      keyframes: {
        'toast-in': {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'toast-in': 'toast-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
}

export default config
