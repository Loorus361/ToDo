// Isolierte Vitest-Konfiguration ohne die Cloudflare-Sites-Build-Plugins
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
  },
});
