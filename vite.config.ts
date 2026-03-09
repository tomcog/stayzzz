import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const icalUrl = env.VITE_AIRBNB_ICAL_URL

  return {
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
            if (!icalUrl) return '/'
            const url = new URL(icalUrl)
            return url.pathname + '?' + url.searchParams.toString()
          },
        },
      },
    },
  }
})
