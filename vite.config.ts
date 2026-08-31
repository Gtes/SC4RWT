/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Render / local: `/`. GitHub Pages project site: set BASE_PATH=/SC4RWT/ in CI.
  base: process.env.BASE_PATH || '/',
  plugins: [react()],
  worker: {
    format: 'es',
  },
  server: {
    // Windows / some editors don't always emit reliable FS events; polling
    // makes Vite see saves without restarting `npm run dev`.
    watch: {
      usePolling: true,
      interval: 300,
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
