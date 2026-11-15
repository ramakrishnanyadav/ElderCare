/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--color-canvas)',
        surface: 'var(--color-surface)',
        hairline: 'var(--color-hairline)',
        ink: {
          DEFAULT: 'var(--color-ink)',
          secondary: 'var(--color-ink-secondary)',
          muted: 'var(--color-ink-muted)',
        },
        teal: {
          50: '#F0F8F7',
          100: '#DAEEEC',
          200: '#B3DCD8',
          300: '#82C3BD',
          400: '#4FA59D',
          500: '#2B8A81',
          600: '#1B7069',
          700: '#12605A',
          800: '#0B554F',
          900: '#073B37',
        },
        status: {
          taken: '#1E7A45',
          due: '#12605A',
          notyet: '#6B7776',
          skipped: '#A35A00',
          missed: '#B42318',
        },
      },
      borderRadius: {
        'card-sm': '16px',
        'card': '20px',
        'card-lg': '28px',
      },
      boxShadow: {
        'card-soft': '0 2px 4px -1px rgba(14,27,26,0.03), 0 8px 24px -4px rgba(14,27,26,0.05)',
        'card-elevated': '0 4px 12px -2px rgba(14,27,26,0.06), 0 16px 32px -4px rgba(14,27,26,0.08)',
        'btn-teal': '0 2px 6px -1px rgba(11,85,79,0.25), 0 6px 16px -2px rgba(11,85,79,0.18)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Noto Sans Devanagari', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
