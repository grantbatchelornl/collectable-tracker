import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Standard Vite + React config.
// Base44 plugin removed as part of Supabase migration.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
