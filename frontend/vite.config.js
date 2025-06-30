import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 5173,
    allowedHosts: import.meta.env.VITE_ALLOWED_HOSTS ? import.meta.env.VITE_ALLOWED_HOSTS.split(',') : ['localhost'],
  },
  plugins: [react()],
})
