import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages project pages are served from a sub-path
// (https://<user>.github.io/Origin/). The deploy workflow sets GITHUB_PAGES;
// local dev and preview stay at '/'. Use '/' here for a user/org page or a
// custom domain. See docs/deployment.md.
const base = process.env.GITHUB_PAGES ? '/Origin/' : '/';

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    // Installable, fully-offline PWA. Workbox precaches the app shell, all
    // bundled content JSON (inlined into the JS chunks via import.meta.glob),
    // and the self-hosted fonts on first visit — the app then runs with no
    // network. See src/lib/pwa.ts for the offline-ready / update UX.
    VitePWA({
      registerType: 'prompt',
      injectRegister: null, // we register manually in src/lib/pwa.ts
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'icon.svg'],
      manifest: {
        name: 'Origin — interactive learning',
        short_name: 'Origin',
        description:
          'Learn complex subjects through short, immersive, story-driven lessons. Works fully offline.',
        theme_color: '#0c0b10',
        background_color: '#0c0b10',
        display: 'standalone',
        orientation: 'portrait',
        start_url: base,
        scope: base,
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precache every built asset so first load online === fully usable
        // offline. Content JSON is inlined into the JS chunks; fonts ship as
        // woff2/woff. Bump the size cap so large bundled content chunks are
        // still precached (default is 2 MiB).
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff,woff2}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        // SPA deep links (/learn/spanish, /account, …) resolve to the app
        // shell when offline.
        navigateFallback: `${base}index.html`,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
      },
    }),
  ],
});
