/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        marine: {
          app: 'var(--marine-bg-app)',
          shell: 'var(--marine-bg-shell)',
          card: 'var(--marine-bg-card)',
          'card-hover': 'var(--marine-bg-card-hover)',
          'surface-muted': 'var(--marine-bg-surface-muted)',
          border: 'var(--marine-border-subtle)',
          'border-focus': 'var(--marine-border-focus)',
          cyan: 'var(--marine-status-normal)',
          amber: 'var(--marine-status-warning)',
          crimson: 'var(--marine-status-critical)',
          blue: 'var(--marine-status-info)',
        },
      },
      textColor: {
        marine: {
          primary: 'var(--marine-text-primary)',
          secondary: 'var(--marine-text-secondary)',
          muted: 'var(--marine-text-muted)',
        },
      },
      minHeight: {
        touch: '44px',
      },
      minWidth: {
        touch: '44px',
      },
    },
  },
  plugins: [],
}
