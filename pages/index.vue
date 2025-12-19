<template lang="pug">
  NuxtLayout(name="default")
    template(#main)
      DrumMachine

    template(#transport)
      TransportBar

    template(#pads)
      PadGrid

    template(#drawer)
      FxPanel
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import DrumMachine from '@/components/DrumMachine.vue'
import PadGrid from '@/components/PadGrid.vue'
import TransportBar from '@/components/TransportBar.vue'
import FxPanel from '@/components/panels/FxPanel.vue'
import { definePageMeta } from '#imports'

definePageMeta({
  title: 'Drum Machine'
})

export default defineComponent({
  name: 'IndexPage',
  components: {
    DrumMachine,
    PadGrid,
    TransportBar,
    FxPanel
  }
})
</script>
