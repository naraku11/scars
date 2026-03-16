import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // Static assets (e.g. .htaccess) are copied as-is into the build output
  publicDir: 'static',

  build: {
    // Output goes directly into backend/public/ so Express can serve it
    outDir: '../backend/public',
    emptyOutDir: true,
  },

  server: {
    port: 5173,
    // In dev, proxy API and Socket.io requests to the Express backend
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
