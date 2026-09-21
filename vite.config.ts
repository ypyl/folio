import { createReadStream, existsSync } from 'node:fs'
import { cp, mkdir } from 'node:fs/promises'
import { join, normalize } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
// GitHub Pages serves the app from /folio/, so CI builds with GITHUB_PAGES=1.
// Local dev and preview keep the root base.
const base = process.env.GITHUB_PAGES ? '/folio/' : '/'

// Excalidraw loads its hand-drawn fonts from `EXCALIDRAW_ASSET_PATH` at
// runtime, not through the bundler (add-whiteboards, design D6). They ship
// inside the package, so the app serves them from its own origin instead of the
// package's CDN fallback: no repo copy, no new dependency, and the offline
// install stays self-contained. `boardView.tsx` points the asset path at
// `<base>excalidraw-assets/`; this plugin answers that path in dev and copies
// the fonts into the build.
const EXCALIDRAW_FONTS = 'node_modules/@excalidraw/excalidraw/dist/prod/fonts'
const EXCALIDRAW_ASSETS = 'excalidraw-assets'

function excalidrawFonts(): Plugin {
  const root = join(process.cwd(), EXCALIDRAW_FONTS)
  const prefix = `${EXCALIDRAW_ASSETS}/fonts/`
  return {
    name: 'folio:excalidraw-fonts',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const at = (req.url ?? '').indexOf(prefix)
        if (at === -1) return next()
        const rel = decodeURIComponent((req.url ?? '').slice(at + prefix.length).split('?')[0])
        const file = normalize(join(root, rel))
        // A path that escapes the fonts directory is not ours to serve.
        if (!file.startsWith(root) || !existsSync(file)) return next()
        res.setHeader('Content-Type', 'font/woff2')
        createReadStream(file).pipe(res)
      })
    },
    async closeBundle() {
      await mkdir(join(process.cwd(), 'dist', EXCALIDRAW_ASSETS), { recursive: true })
      await cp(root, join(process.cwd(), 'dist', EXCALIDRAW_ASSETS, 'fonts'), { recursive: true })
    },
  }
}

export default defineConfig({
  base,
  plugins: [
    react(),
    excalidrawFonts(),
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
        // The board editor is lazy and must not be part of the offline install
        // (add-whiteboards, design D6): installing the PWA should not download
        // a ~3 MB canvas app and its fonts for a vault that may never hold a
        // board. It is fetched on the first board open instead.
        globIgnores: ['**/excalidraw-*.js', '**/excalidraw-*.css', '**/excalidraw-assets/**'],
        navigateFallback: `${base}index.html`,
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        // Give the board editor a deterministic chunk name so the precache
        // exclusion above can name it. The board's whole reachable graph rides
        // with it — Excalidraw, and the mermaid diagram renderers it pulls in
        // for pasted Mermaid text — because those modules are only ever reached
        // through the board's dynamic import and would otherwise be precached
        // under their own chunk names.
        manualChunks(id) {
          if (
            id.includes('node_modules/@excalidraw/') ||
            id.includes('node_modules/@mermaid-js/') ||
            id.includes('node_modules/mermaid/') ||
            id.includes('node_modules/cytoscape') ||
            id.includes('node_modules/katex')
          ) {
            return 'excalidraw'
          }
        },
      },
    },
  },
})
