import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  logLevel: 'silent',
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
  },
  resolve: {
    alias: {
      '@vizzo/shared': resolve(__dirname, '../shared/src'),
    },
  },
  server: {
    port: 3002,
    host: true,
  },
});
