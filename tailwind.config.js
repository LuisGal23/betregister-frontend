/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],     // 12px minimum per Part J2.1
        'sm': ['0.875rem', { lineHeight: '1.25rem' }], // 14px
        'base': ['1rem', { lineHeight: '1.5rem' }],    // 16px
        'lg': ['1.125rem', { lineHeight: '1.75rem' }], // 18px
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],  // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem' }],     // 24px
      },
      colors: {
        // Part J2.2 Semantic Palette (WCAG AA >= 4.5:1 on dark surfaces)
        canvas: '#090d16',
        card: '#111827',
        elevated: '#1e293b',
        won: '#10b981',
        lost: '#ef4444',
        pending: '#f59e0b',
        model: '#3b82f6',
        consensus: '#8b5cf6',
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
        muted: 'var(--muted)',
        text: {
          DEFAULT: 'var(--text)',
          muted: 'var(--muted)',
        }
      },
      borderRadius: {
        'panel': '12px', // rounded-xl unified per Part J2.3
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
