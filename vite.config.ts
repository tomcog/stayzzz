import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'
import fs from 'fs'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const icalUrl = env.VITE_AIRBNB_ICAL_URL
  const vrboIcalUrl = env.VITE_VRBO_ICAL_URL
  const portsPath = path.resolve(__dirname, '../ports.json')
  const ports = fs.existsSync(portsPath)
    ? JSON.parse(fs.readFileSync(portsPath, 'utf-8'))
    : {}

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
              src: 'pwa-64x64.png',
              sizes: '64x64',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'pwa-maskable-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: 'pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
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
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'radix': [
              '@radix-ui/react-accordion',
              '@radix-ui/react-alert-dialog',
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-label',
              '@radix-ui/react-popover',
              '@radix-ui/react-radio-group',
              '@radix-ui/react-select',
              '@radix-ui/react-separator',
              '@radix-ui/react-slot',
              '@radix-ui/react-switch',
              '@radix-ui/react-tabs',
            ],
            'ical': ['ical.js'],
          },
        },
      },
    },
    server: {
      port: ports['Stayzzz'],
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
