import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons.svg', 'icons/*.png'],
      manifest: {
        name: 'Winter Arc Tracker',
        short_name: 'WinterArc',
        description:
          'Build better habits with your crew — daily check-ins, streaks, and challenges.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0b0d10',
        theme_color: '#0b0d10',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // SPA fallback for app routes — but never for API/auth.
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/, /auth\/v1/, /\/callback/],
        runtimeCaching: [
          {
            // Supabase REST / Auth / Realtime / Storage: always network.
            // The service worker must never serve or cache backend data.
            urlPattern: ({ url }) =>
              url.hostname.endsWith('.supabase.co') ||
              url.pathname.includes('/auth/v1') ||
              url.pathname.includes('/rest/v1') ||
              url.pathname.includes('/realtime/v1') ||
              url.pathname.includes('/storage/v1'),
            handler: 'NetworkOnly',
          },
          {
            // Google OAuth + fonts: network-first, never stale auth.
            urlPattern: ({ url }) =>
              url.hostname.includes('accounts.google') ||
              url.hostname.includes('apis.google') ||
              url.hostname.includes('fonts.g'),
            handler: 'NetworkFirst',
            options: { cacheName: 'google-runtime' },
          },
          {
            // App images: safe to cache.
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'app-images',
              expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
        ],
      },
    }),
  ],
})
