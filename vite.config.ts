import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api/ical': {
        target: 'https://www.airbnb.com',
        changeOrigin: true,
        rewrite: () => {
          const url = new URL(process.env.VITE_AIRBNB_ICAL_URL || '');
          return url.pathname + '?' + url.searchParams.toString();
        },
      },
    },
  },
})
