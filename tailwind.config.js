/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./examples/nextjs-demo/src/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'zf-primary': 'var(--zf-primary-color, #6366f1)',
        'zf-secondary': 'var(--zf-secondary-color, #8b5cf6)',
        'zf-background': 'var(--zf-background, #0f172a)',
        'zf-surface': 'var(--zf-surface, #1e293b)',
        'zf-border': 'var(--zf-border, #334155)',
        'zf-text': 'var(--zf-text, #f8fafc)',
        'zf-text-muted': 'var(--zf-text-muted, #94a3b8)',
        'zf-error': 'var(--zf-error, #ef4444)',
        'zf-success': 'var(--zf-success, #10b981)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-in-out',
        'slide-down': 'slideDown 0.2s ease-out',
        'star-pulse': 'starPulse 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-4px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        starPulse: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class',
    }),
  ],
}