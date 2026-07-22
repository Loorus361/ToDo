/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const basePath = process.env.BASE_PATH ?? '/';

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
      includeAssets: ['og.png'],
      strategies: 'generateSW',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // IndexedDB-Daten nicht cachen — Local-First, keine Netzwerk-Anfragen
        runtimeCaching: [],
      },
      manifest: {
        name: 'Ausbildungsverlauf',
        short_name: 'Ausbildung',
        description: 'Interaktiver Zeitstrahl für laufende Referendariatskampagnen',
        theme_color: '#3b82f6',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: basePath,
        scope: basePath,
        lang: 'de',
      },
    }),
  ],
});
