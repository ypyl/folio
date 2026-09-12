import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
// GitHub Pages serves the app from /folio/, so CI builds with GITHUB_PAGES=1.
// Local dev and preview keep the root base.
const base = process.env.GITHUB_PAGES ? '/folio/' : '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['folio-mark.svg'],
      manifest: {
        name: 'Folio',
        short_name: 'Folio',
        description: 'A lightweight, local-first alternative to Logseq. Your Markdown folder is the database.',
        theme_color: '#1B365D',
        background_color: '#f5f4ed',
        display: 'standalone',
        // Relative so the manifest resolves correctly under any base path.
        start_url: './',
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
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: `${base}index.html`,
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
})