/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        echo: {
          50:  '#f0eeff',
          100: '#e2ddff',
          200: '#c8beff',
          300: '#a99bff',
          400: '#8b6ef5',
          500: '#6C63FF',   // primary brand
          600: '#5a52d5',
          700: '#4a43b3',
          800: '#3a3590',
          900: '#2d296e',
        },
        warm: {
          50:  '#fff8f0',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
        },
        calm: {
          50:  '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        dyslexic: ['"OpenDyslexic"', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'echo': '0 4px 32px rgba(108, 99, 255, 0.15)',
        'echo-lg': '0 8px 48px rgba(108, 99, 255, 0.25)',
        'warm': '0 4px 24px rgba(249, 115, 22, 0.15)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-soft': 'bounce-soft 2s ease-in-out infinite',
        'wave': 'wave 1.5s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite',
        'typewriter': 'typewriter 0.05s steps(1) forwards',
        'fade-in': 'fadeIn 0.4s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
      },
      keyframes: {
        'bounce-soft': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'wave': {
          '0%, 100%': { transform: 'scaleY(0.3)' },
          '50%': { transform: 'scaleY(1)' },
        },
        'glow': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(108, 99, 255, 0.4)' },
          '50%': { boxShadow: '0 0 24px rgba(108, 99, 255, 0.8)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
