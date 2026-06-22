import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Sends /api requests to the Python backend (fixes Windows localhost issues)
    proxy: {
      '/api': 'http://127.0.0.1:8002',
    },
  },
})
