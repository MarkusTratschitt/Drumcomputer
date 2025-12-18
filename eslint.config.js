import js from '@eslint/js'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import vue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'
import globals from 'globals'

export default [{
    ignores: ['node_modules', '.nuxt', '.output', 'dist']
  },
  {
    files: ['**/*.{ts,tsx,js,jsx,vue}'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tsParser,
        ecmaVersion: 'latest',
        sourceType: 'module',
        extraFileExtensions: ['.vue']
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
        defineNuxtPlugin: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint,
      vue
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      ...vue.configs['vue3-recommended'].rules,
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-empty-object-type': 'off'
    }
  },

  // 🔹 ✅ Tests (Mocha)
  {
    files: ['**/*.spec.ts', '**/*.d.ts'],
    languageOptions: {
      globals: {
        ...globals.mocha
      }
    }
  }
]