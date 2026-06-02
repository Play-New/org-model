import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Deploy base: '/' locally and for root/custom-domain hosting; the Pages workflow
// sets VITE_BASE to the repo subpath when deploying to a project site.
const base = process.env.VITE_BASE || '/';

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'fonts/mirage-variable.woff2', 'fonts/inter-variable.woff2'],
      // Generic manifest. A fork (e.g. a brand) overrides name + icons at build time;
      // the wizard sets the in-app title/favicon at runtime.
      manifest: {
        name: 'Org/',
        short_name: 'Org',
        description: 'Your organization, as a living model.',
        theme_color: '#1A1A1A',
        background_color: '#F7F6F3',
        display: 'standalone',
        start_url: '.',
        icons: [
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,svg}'],
        navigateFallback: 'index.html',
      },
    }),
  ],
});
