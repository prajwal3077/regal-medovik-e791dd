import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url'

// In local development, /api requests are proxied to the Flask backend.
// Override with VITE_API_PROXY (e.g. when running `netlify dev`, functions serve /api directly).
const apiTarget = process.env.VITE_API_PROXY || 'http://127.0.0.1:5000'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@shared': fileURLToPath(new URL('../shared', import.meta.url)) },
  },
  server: {
    port: 5173,
    fs: { allow: ['..'] },
    proxy: { '/api': { target: apiTarget, changeOrigin: true } },
  },
})
