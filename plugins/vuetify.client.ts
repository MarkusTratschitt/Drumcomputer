import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

export default defineNuxtPlugin(nuxtApp => {
  console.log('[vuetify] plugin loaded')

  const vuetify = createVuetify({
    components,
    directives,
    ssr: false
  })

  nuxtApp.vueApp.use(vuetify)
})
