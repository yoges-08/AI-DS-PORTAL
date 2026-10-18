/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          navy: '#1F3A6E',
          'navy-dark': '#152950',
          'navy-light': '#2A4E93',
          bg: '#F5F7FA',
          border: '#D1D5DB',
          subtle: '#6B7280',
          dark: '#111827',
          card: '#FFFFFF',
          success: '#15803D',
          'success-bg': '#F0FDF4',
          warning: '#B45309',
          'warning-bg': '#FFFBEB',
          danger: '#B91C1C',
          'danger-bg': '#FEF2F2',
          info: '#1D4ED8',
          'info-bg': '#EFF6FF'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans', 'Segoe UI', 'Roboto', 'sans-serif']
      },
      borderRadius: {
        DEFAULT: '4px',
        sm: '2px',
        md: '4px',
        lg: '6px'
      }
    },
  },
  plugins: [],
}
