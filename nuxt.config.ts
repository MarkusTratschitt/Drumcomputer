import { defineNuxtConfig } from 'nuxt/config'
import { pwaConfig } from './config/pwa'

const DEFAULT_HMR_PORT = 24678
const hmrPort = Number.isInteger(Number(process.env.HMR_PORT)) && process.env.HMR_PORT
  ? Number(process.env.HMR_PORT)
  : DEFAULT_HMR_PORT

export default defineNuxtConfig({
  ssr: false,
  debug: true,
  compatibilityDate: '2024-04-03',
  devtools: { enabled: true },
  modules: [
    '@pinia/nuxt',
    ['@vite-pwa/nuxt', pwaConfig],
    ],

  
  css: ['vuetify/styles'],
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
  }
})
