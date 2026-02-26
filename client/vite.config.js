import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite configuration for React app
// - Adds a dev proxy for "/api" so frontend (5173) can talk to backend (5001)
// - This avoids CORS issues and allows cookie-based auth in development
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
})
