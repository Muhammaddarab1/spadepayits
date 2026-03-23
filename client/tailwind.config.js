/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#1E40AF', // Deep Blue
        success: '#10B981', // Emerald Green
        warning: '#F59E0B', // Amber/Yellow
        danger: '#EF4444', // Red
        progress: '#3B82F6', // Bright Blue
        slateText: '#1E293B', // Dark Slate
        bgSoft: '#F1F5F9', // Light Gray
      },
    },
  },
  plugins: [],
}
