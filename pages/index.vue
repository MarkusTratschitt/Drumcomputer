<template>
  <DrumMachine>
    <template #main>
      <div class="main-placeholder" />
    </template>

    <template #pads="{ props }">
      <PadGrid v-bind="props.padGridProps" />
    </template>

    <template #transport="{ props }">
      <TransportBar v-bind="props.transportProps" />
    </template>

    <template #drawer="{ props }">
      <FxPanel v-bind="props.fxProps" />
    </template>
  </DrumMachine>
</template>

<script>
import DrumMachine from '@/components/DrumMachine.vue'
import TransportBar from '@/components/TransportBar.vue'
import PadGrid from '@/components/PadGrid.vue'
import FxPanel from '@/components/panels/FxPanel.vue'

export default {
  // Composes the DrumMachine with transport, pads, and FX panels for the main page.
  components: {
    DrumMachine,
    TransportBar,
    PadGrid,
    FxPanel
  }
}
</script>

<style scoped>
.main-placeholder {
  width: 100%;
  height: 100%;
}
</style>
