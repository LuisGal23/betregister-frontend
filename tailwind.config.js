/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#29b8f5',
          hover: '#0284c7',
          soft: 'rgba(41, 184, 245, 0.15)',
        },
        surface: {
          DEFAULT: 'var(--surface)',
          high: 'var(--surface-high)',
          highest: 'var(--surface-highest)',
          low: 'var(--surface-low)',
        },
        bg: {
          DEFAULT: 'var(--bg)',
          elevated: 'var(--bg-elevated)',
        },
        border: {
          DEFAULT: 'var(--border)',
          hover: 'rgba(255, 255, 255, 0.15)',
        },
        text: {
          DEFAULT: 'var(--text)',
          muted: 'var(--muted)',
        }
      },
      borderRadius: {
        'panel': '20px',
        'pill': '9999px',
      },
      boxShadow: {
        'panel': '0 12px 36px rgba(0, 0, 0, 0.28)',
        'panel-hover': '0 20px 48px rgba(0, 0, 0, 0.42), 0 0 28px rgba(41, 184, 245, 0.16)',
        'glow-cyan': '0 4px 18px rgba(41, 184, 245, 0.38)',
      }
    },
  },
  plugins: [],
}
