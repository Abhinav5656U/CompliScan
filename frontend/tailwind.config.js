/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // toggle via a 'dark' class on <html>, not OS preference
  content: [
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Brand scale — placeholder govtech navy/teal until final theme is locked.
        // Swap these hex values later; every component already reads from `primary-*`.
        primary: {
          50:  '#eef6f6',
          100: '#d6ebea',
          200: '#aed7d5',
          300: '#7fbdba',
          400: '#4a9f9c',
          500: '#2d827e',
          600: '#216866',
          700: '#1c5452',
          800: '#173f3e', // main brand color (navbar, buttons)
          900: '#122d2c',
          950: '#0a1a19',
        },
        // Semantic surface tokens driven by CSS variables so dark mode
        // just swaps the variable values — components never branch on `dark:` manually.
        surface: {
          DEFAULT: 'rgb(var(--surface) / <alpha-value>)',
          raised: 'rgb(var(--surface-raised) / <alpha-value>)',
          sunken: 'rgb(var(--surface-sunken) / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'rgb(var(--ink) / <alpha-value>)',
          muted: 'rgb(var(--ink-muted) / <alpha-value>)',
          faint: 'rgb(var(--ink-faint) / <alpha-value>)',
        },
        line: 'rgb(var(--line) / <alpha-value>)',
      },
      boxShadow: {
        soft: '0 2px 8px 0 rgb(0 0 0 / 0.06)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}