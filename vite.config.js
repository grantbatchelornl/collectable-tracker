import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Production Vite + React configuration.
// COLLECTABLE is hosted at the root of collectabletracker.com.
// Base44 is no longer part of the application stack.
export default defineConfig({
  base: '/',

  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
