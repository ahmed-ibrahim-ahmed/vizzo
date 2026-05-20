import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
  },
  resolve: {
    alias: {
      '@vizzo/shared': resolve(__dirname, '../shared/src'),
      '@vizzo/shared/constants': resolve(__dirname, '../shared/src/constants'),
      '@vizzo/shared/types': resolve(__dirname, '../shared/src/types'),
      '@vizzo/shared/utils': resolve(__dirname, '../shared/src/utils'),
      '@vizzo/shared/supabase': resolve(__dirname, '../shared/src/supabase/client.ts'),
    },
  },
  server: {
    port: 3000,
    host: true,
  },
});
