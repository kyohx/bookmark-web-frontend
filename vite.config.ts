/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Proxy configuration for local development environment
    proxy: {
      '/token': 'http://localhost:8000',
      '/me': 'http://localhost:8000',
      '/bookmarks': 'http://localhost:8000',
      '/users': 'http://localhost:8000',
      '/version': 'http://localhost:8000',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
  },
})
