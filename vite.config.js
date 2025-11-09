import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const isProd = process.env.NODE_ENV === 'production'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  // 👇 cambia automáticamente según entorno
  base: isProd ? '/fideliza-plus/' : '/',
  server: {
    port: 5173,
    open: true,
    proxy: isProd
      ? undefined // en producción no hay backend local
      : {
          '/api': {
            target: 'http://localhost:3000',
            changeOrigin: true,
          },
        },
  },
})