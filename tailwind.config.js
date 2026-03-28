/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Teal accent — used for active state & branding
        brand: {
          50:  '#f0f7f5',
          100: '#d6ece8',
          200: '#aed8d0',
          300: '#7ec3b8',
          400: '#4eae9f',
          500: '#2E6B5E',
          600: '#265a4f',
          700: '#1e4a41',
          800: '#163932',
          900: '#0e2923',
        },
        // Sidebar / nav background
        sidebar: '#1C1828',
      },
      fontFamily: {
        sans: ['Fira Code', 'monospace'],
      },
      boxShadow: {
        card:    '0 1px 3px 0 rgb(0 0 0 / 0.08), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'card-md': '0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
        'card-lg': '0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.05)',
        glow:    '0 0 20px rgba(46,107,94,0.2)',
        'glow-sm': '0 0 10px rgba(46,107,94,0.15)',
      },
    },
  },
  plugins: [],
};
