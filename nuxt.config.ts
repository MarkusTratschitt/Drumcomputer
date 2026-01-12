import { defineNuxtConfig } from 'nuxt/config'

const DEFAULT_HMR_PORT = 24678
const hmrPort = Number.isInteger(Number(process.env.HMR_PORT)) && process.env.HMR_PORT
  ? Number(process.env.HMR_PORT)
  : DEFAULT_HMR_PORT

export default defineNuxtConfig({
  // Nuxt configuration for the client-only drum machine, wiring modules, styles, and Vite options.
  ssr: false,
  debug: true,
  compatibilityDate: '2024-04-03',
  devtools: {
    enabled: true,

    timeline: {
      enabled: true
    }
  },
  modules: [
    '@pinia/nuxt'
  ],


  css: ['vuetify/styles', '@/styles/globals.less'],
  typescript: {
    strict: true,
    typeCheck: false
  },
  devServer: {
    host: '0.0.0.0',
    port: 3100
  },
  nitro: {
    prerender: {
      routes: []
    }
  },
  vite: {
    server: {
      hmr: {
        port: hmrPort,
        host: '127.0.0.1'
      }
    },

    define: {
      'process.env.DEBUG': true
    },
    css: {
      preprocessorOptions: {
        less: {
          javascriptEnabled: true,
          additionalData: `@import '@/styles/variables.less';`
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
  }
})
