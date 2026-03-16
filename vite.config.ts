import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const icalUrl = env.VITE_AIRBNB_ICAL_URL
  const vrboIcalUrl = env.VITE_VRBO_ICAL_URL

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
        manifest: {
          name: 'Stayzzz',
          short_name: 'Stayzzz',
          description: 'Booking management for Andreas Palms',
          theme_color: '#ffffff',
          background_color: '#ffffff',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5174,
      strictPort: true,
      proxy: {
        '/api/ical': {
          target: 'https://www.airbnb.com',
          changeOrigin: true,
          rewrite: () => {
            try {
              if (!icalUrl) return '/'
              const url = new URL(icalUrl)
              return url.pathname + '?' + url.searchParams.toString()
            } catch {
              return '/'
            }
          },
        },
        '/api/vrbo-ical': {
          target: 'https://www.vrbo.com',
          changeOrigin: true,
          rewrite: () => {
            try {
              if (!vrboIcalUrl) return '/'
              const url = new URL(vrboIcalUrl)
              return url.pathname + '?' + url.searchParams.toString()
            } catch {
              return '/'
            }
          },
        },
      },
    },
  }
})
