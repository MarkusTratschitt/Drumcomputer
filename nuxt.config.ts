import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt', '@vite-pwa/nuxt'],
  css: ['vuetify/styles', '~/styles/drum-machine.less', '~/styles/vuetify-overrides.less'],
  typescript: {
    strict: true,
    typeCheck: true
  },
  devServer: {
    host: '0.0.0.0',
    port: 3100
  },
  vite: {
    server: {
      hmr: {
        port: 24679
      }
    },
    define: {
      'process.env.DEBUG': false
    },
    css: {
      preprocessorOptions: {
        less: {
          javascriptEnabled: true
        }
      }
    }
  },
  pages: true,
  app: {
    head: {
      title: 'Drumcomputer',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Nuxt 4 Drumcomputer with WebAudio and MIDI' }
      ]
    }
  },
  pwa: {
    manifest: {
      name: 'Drumcomputer',
      short_name: 'Drumcomputer',
      theme_color: '#121212',
      background_color: '#121212',
      display: 'standalone'
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico}']
    }
  },
  build: {
    transpile: ['vuetify']
  },
  vue: {
    compilerOptions: {
      whitespace: 'condense'
    }
  }
})
