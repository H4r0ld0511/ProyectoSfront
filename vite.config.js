import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // En desarrollo, replica el reverse proxy de Nginx: /api -> backend local.
    // Si el backend usa API_PREFIX=/api/v1, descomenta el rewrite.
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, '/api/v1'),
      },
    },
  },
})
