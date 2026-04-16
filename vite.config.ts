/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const basePath = '/ToDo/';

export default defineConfig({
  base: basePath,
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    include: ['@dnd-kit/sortable', '@dnd-kit/utilities'],
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'pwa-192x192.png', 'pwa-512x512.png'],
      strategies: 'generateSW',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // IndexedDB-Daten nicht cachen — Local-First, keine Netzwerk-Anfragen
        runtimeCaching: [],
      },
      manifest: {
        name: 'WorkVibe',
        short_name: 'WorkVibe',
        description: 'Minimalistisches Projekt- & Organisationstool — Local First',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: basePath,
        scope: basePath,
        lang: 'de',
        icons: [
          {
            // Platzhalter: public/pwa-192x192.png ersetzen
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            // Platzhalter: public/pwa-512x512.png ersetzen
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable any',
          },
        ],
      },
    }),
  ],
});
