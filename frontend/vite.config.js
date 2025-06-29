import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  server: {
    port: 5173,
    allowedHosts: ['f169-108-53-147-205.ngrok-free.app'],
  },
  plugins: [react()],
})
