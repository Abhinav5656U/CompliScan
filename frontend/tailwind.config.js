/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        ledger: ['"Special Elite"', '"Courier New"', 'monospace'],
      },
      colors: {
        primary: {
          50: '#ecf2ee',
          100: '#d5e2da',
          200: '#aac6b6',
          300: '#7ea992',
          400: '#568d6e',
          500: '#3a6c52',
          600: '#2f5741',
          700: '#264736',
          800: '#1F3A2E',
          900: '#182e24',
          950: '#0f1f19',
        },
        parchment: {
          50: '#fdfcf7',
          100: '#FAF6EC',
          200: '#F4EFE3',
          300: '#ebe3d0',
          400: '#ddd1b5',
          500: '#c9b98f',
        },
        ink: {
          DEFAULT: '#1B1B16',
          600: '#2a2a24',
          500: '#3d3d35',
          400: '#55554a',
          300: '#6f6f62',
        },
        stamp: {
          DEFAULT: '#A6321E',
          50: '#fbe9e5',
          100: '#f6d2cb',
          200: '#eaa99c',
          300: '#dc7b6a',
          400: '#c2543f',
          500: '#A6321E',
          600: '#8c2a19',
          700: '#712214',
        },
        seal: {
          DEFAULT: '#B08D57',
          100: '#f3eadb',
          200: '#e6d5b8',
          300: '#d4ba92',
          400: '#c2a274',
          500: '#B08D57',
          600: '#96753f',
          700: '#7a5f33',
        },
      },
      boxShadow: {
        'ledger': '0 1px 0 rgba(27,27,22,0.06), 0 0 0 1px rgba(176,141,87,0.08)',
        'stamp': 'inset 0 -3px 0 rgba(0,0,0,0.15), 0 1px 2px rgba(27,27,22,0.2)',
      },
      borderRadius: {
        'ledger': '2px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
