<template>
  <DrumMachine>
    <DrumMachineSlots
      v-slot:main="{ props }"
      v-slot:transport="{ props }"
      v-slot:pads="{ props }"
      v-slot:drawer="{ props }"
    >
      <template #main>
        <StepGrid v-bind="props.stepGridProps" />
      </template>

      <template #transport>
        <TransportBar v-bind="props.transportProps" />
      </template>

      <template #pads>
        <PadGrid v-bind="props.padGridProps" />
      </template>

      <template #drawer>
        <FxPanel v-bind="props.fxProps" />
      </template>
    </DrumMachineSlots>
  </DrumMachine>
</template>




<script setup lang="ts">
import DrumMachine from '@/components/DrumMachine.vue'
import FxPanel from '@/components/panels/FxPanel.vue'
import PadGrid from '@/components/PadGrid.vue'
import StepGrid from '@/components/StepGrid.vue'
import TransportBar from '@/components/TransportBar.vue'
</script>
