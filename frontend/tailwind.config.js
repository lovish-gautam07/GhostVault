/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Charcoal / graphite palette
        vault: {
          50:  '#f7f7f8',
          100: '#eeeef0',
          150: '#e2e2e5',
          200: '#d1d1d6',
          300: '#a9a9b2',
          400: '#81818d',
          500: '#63636e',
          600: '#4a4a54',
          700: '#363640',
          800: '#27272f',
          850: '#1f1f26',
          900: '#17171c',
          950: '#0f0f13',
        },
        // Muted slate blue accent
        accent: {
          50:  '#f0f4f8',
          100: '#d9e2ec',
          200: '#bcccdc',
          300: '#9fb3c8',
          400: '#829ab1',
          500: '#627d98',
          600: '#486581',
          700: '#334e68',
          800: '#243b53',
          900: '#102a43',
        },
        // Status colors — muted, not neon
        safe:   { light: '#e6f4ea', DEFAULT: '#2e7d4a', dark: '#1a3a2a' },
        warn:   { light: '#fef3cd', DEFAULT: '#b8860b', dark: '#3d2e04' },
        danger: { light: '#fde8e8', DEFAULT: '#c53030', dark: '#3b1010' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Fira Code', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '6px',
        lg: '8px',
        xl: '12px',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px -1px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 12px 0 rgba(0,0,0,0.08), 0 2px 4px -1px rgba(0,0,0,0.06)',
        'modal': '0 20px 60px -12px rgba(0,0,0,0.25)',
      },
      animation: {
        'check-pulse': 'checkPulse 0.6s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        checkPulse: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
