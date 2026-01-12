/**
 * Vuetify Setup Test
 * Verifies that Vuetify 3 is correctly configured and available in the Nuxt 4 application.
 */

import { describe, it, expect } from 'vitest'
import { createVuetify } from 'vuetify'

describe('Vuetify Setup', () => {
  it('can create Vuetify instance', () => {
    const vuetify = createVuetify()

    expect(vuetify).toBeDefined()
    expect(vuetify.theme).toBeDefined()
    expect(vuetify.display).toBeDefined()
    expect(vuetify.locale).toBeDefined()
  })

  it('Vuetify theme configuration works', () => {
    const vuetify = createVuetify({
      theme: {
        defaultTheme: 'dark',
        themes: {
          dark: {
            dark: true,
            colors: {
              primary: '#2EC5FF',
              secondary: '#5EE1FF',
              background: '#0E1013',
              surface: '#12151B'
            }
          }
        }
      }
    })

    expect(vuetify.theme.global.name.value).toBe('dark')
    expect(vuetify.theme.themes.value.dark).toBeDefined()
    expect(vuetify.theme.themes.value.dark.colors.primary).toBe('#2EC5FF')
  })

  it('Vuetify can be instantiated with custom icons config', () => {
    const vuetify = createVuetify({
      icons: {
        defaultSet: 'mdi'
      }
    })

    expect(vuetify).toBeDefined()
    expect(vuetify.icons).toBeDefined()
  })
})
