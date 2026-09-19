import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Standard Vite + React config.
// Base44 plugin removed as part of Supabase migration.
//
// GitHub Pages initially serves this repository from /collectable-tracker/.
// Once collectabletracker.com is attached, Pages serves the app from /.
// GITHUB_ACTIONS lets the temporary Pages deployment use the repository path
// without changing local development behavior.
export default defineConfig({
  base: process.env.GITHUB_ACTIONS === 'true'
    ? '/collectable-tracker/'
    : '/',

  plugins: [react()],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
