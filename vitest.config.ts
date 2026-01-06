// vitest.config.ts
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

const root = fileURLToPath(new URL('./', import.meta.url))

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': root, '~': root },
  },
  test: {
    environment: 'jsdom',
    globals: true,

    // ✅ NUR deine Tests einsammeln
    include: [
      'tests/**/*.{test,spec}.?(c|m)[tj]s?(x)',
    ],

    // ✅ zusätzlich absichern
    exclude: [
      '**/node_modules/**',
      '**/.nuxt/**',
      '**/.output/**',
      '**/dist/**',
      '**/coverage/**',
      '**/*.mocha.spec.*',
    ],
  },
})
