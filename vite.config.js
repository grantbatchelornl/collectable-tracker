import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Production Vite + React configuration.
// COLLECTABLE is hosted at the root of collectabletracker.com.
// Base44 is no longer part of the application stack.
export default defineConfig({
  base: '/',

  plugins: [
    react(),
    {
      name: 'verify-required-build-env',
      configResolved() {
        const required = [
          'VITE_SUPABASE_URL',
          'VITE_SUPABASE_ANON_KEY',
        ];

        const missing = required.filter((name) => !process.env[name]);

        console.log(
          '[build-env] VITE_SUPABASE_URL:',
          process.env.VITE_SUPABASE_URL ? 'SET' : 'MISSING'
        );
        console.log(
          '[build-env] VITE_SUPABASE_ANON_KEY:',
          process.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'MISSING'
        );

        if (missing.length) {
          throw new Error(
            `Missing required build environment variables: ${missing.join(', ')}`
          );
        }
      },
    },
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
