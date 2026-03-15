import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  publicDir: 'static',   // static assets source (copied as-is into build output)
  build: {
    outDir: 'public',    // Hostinger expects output in public/
    emptyOutDir: true,
  },
  server: {
    historyApiFallback: true,
    proxy: {
      '/api': 'http://localhost:3001',
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
