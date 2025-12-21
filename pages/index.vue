<template>
  <DrumMachine>
    <template #main="{ props }">
      <StepGrid v-bind="props.stepGridProps" />
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
import StepGrid from '@/components/StepGrid.vue'
import FxPanel from '@/components/panels/FxPanel.vue'

export default {
  components: {
    DrumMachine,
    TransportBar,
    PadGrid,
    StepGrid,
    FxPanel
  }
}
</script>

