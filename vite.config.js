import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    open: true
  },
  build: {
    sourcemap: true,
    commonjsOptions: {
      include: []
    }
  },
  optimizeDeps: {
    disabled: false
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: '@testing-library/jest-dom',
    mockReset: true
  }
})
