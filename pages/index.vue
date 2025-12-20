<template>
  <DrumMachine>
    <template #default="{ ctx }">
      <DrumMachineSlots>
        <template #main>
          <StepGrid v-bind="ctx.main.stepGridProps" />
        </template>

        <template #transport>
          <TransportBar v-bind="ctx.transport.transportProps" />
        </template>

        <template #pads>
          <PadGrid v-bind="ctx.pads.padGridProps" />
        </template>

        <template #drawer>
          <FxPanel v-bind="ctx.drawer.fxProps" />
        </template>
      </DrumMachineSlots>
    </template>
  </DrumMachine>
</template>





<script setup lang="ts">
import DrumMachine from '@/components/DrumMachine.vue'
import FxPanel from '@/components/panels/FxPanel.vue'
import PadGrid from '@/components/PadGrid.vue'
import StepGrid from '@/components/StepGrid.vue'
import TransportBar from '@/components/TransportBar.vue'
</script>
