/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
        progress: '#3B82F6',
        slateText: '#0F172A',
        bgSoft: '#F8FAFC',
      },
    },
  },
  plugins: [],
}
