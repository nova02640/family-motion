import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const serverUrl = process.env.VITE_SERVER_URL ?? 'http://localhost:2567';

export default defineConfig({
  base: './',
  define: {
    'import.meta.env.VITE_SERVER_URL': JSON.stringify(serverUrl),
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: serverUrl,
        changeOrigin: true,
      },
      '/colyseus': {
        target: serverUrl,
        changeOrigin: true,
        ws: false,
      },
    },
  },
  resolve: {
    alias: {
      '@mir/shared': fileURLToPath(new URL('../shared/src/index.ts', import.meta.url)),
    },
  },
});
