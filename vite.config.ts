/// <reference types="vitest" />
import { configDefaults, defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiProxyTarget = env.VITE_DEV_PROXY_TARGET || 'http://localhost:8000'
  const allowedHosts = env.VITE_DEV_ALLOWED_HOSTS
    ? env.VITE_DEV_ALLOWED_HOSTS.split(',').map((host) => host.trim()).filter(Boolean)
    : undefined

  return {
    plugins: [react()],
    server: {
      allowedHosts,
      // Proxy configuration for local development environment
      proxy: {
        '/token': apiProxyTarget,
        '/refresh': apiProxyTarget,
        '/me': apiProxyTarget,
        '/bookmarks': apiProxyTarget,
        '/users': apiProxyTarget,
        '/version': apiProxyTarget,
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './tests/setup.ts',
      exclude: [...configDefaults.exclude, 'e2e/**'],
    },
  }
})
