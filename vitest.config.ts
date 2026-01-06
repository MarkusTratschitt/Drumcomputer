// vitest.config.ts
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

const root = fileURLToPath(new URL('./', import.meta.url))

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': root,
      '~': root,
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    // wir splitten gleich Mocha raus:
    exclude: ['**/*.mocha.spec.*', '**/transportEngine.spec.ts'],
  },
})
