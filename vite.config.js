import { defineConfig } from "vitest/config"
import checker from "vite-plugin-checker"
import react from "@vitejs/plugin-react"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    checker({
      eslint: {
        lintCommand: "eslint .",
      },
    }),
  ],
  server: {
    open: true,
  },
  build: {
    sourcemap: true,
    commonjsOptions: {
      include: [],
    },
  },
  optimizeDeps: {
    disabled: false,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "@testing-library/jest-dom",
    mockReset: true,
  },
})
