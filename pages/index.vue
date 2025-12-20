<template>
  <NuxtLayout name="default">
    <DrumMachine>
      <template #main="mainSlot">
        <StepGrid
          v-bind="mainSlot.stepGridProps"
          @step:toggle="mainSlot.stepGridProps.onToggleStep"
          @playhead:scrub="mainSlot.stepGridProps.onScrubPlayhead"
          @step:velocity="mainSlot.stepGridProps.onUpdateStepVelocity"
        />
      </template>

      <template #transport="transportSlot">
        <TransportBar
          v-bind="transportSlot.transportProps"
          @play="transportSlot.transportProps.onPlay"
          @stop="transportSlot.transportProps.onStop"
          @bpm:update="transportSlot.transportProps.onUpdateBpm"
          @division:update="transportSlot.transportProps.onUpdateDivision"
          @loop:update="transportSlot.transportProps.onUpdateLoop"
          @midi-learn:toggle="transportSlot.transportProps.onToggleMidiLearn"
        />

        <div v-if="transportSlot.isMidiLearning">
          {{ transportSlot.midiLearnLabel }}
        </div>
      </template>

      <template #pads="padsSlot">
        <PadGrid
          v-bind="padsSlot.padGridProps"
          @pad:down="padsSlot.padGridProps.onPadDown"
          @pad:select="padsSlot.padGridProps.onPadSelect"
        />
      </template>

      <template #drawer="drawerSlot">
        <FxPanel
          v-bind="drawerSlot.fxProps"
          @fx:update="drawerSlot.fxProps.onUpdateFx"
        />
      </template>
    </DrumMachine>
  </NuxtLayout>
</template>


<script setup lang="ts">
import DrumMachine from '@/components/DrumMachine.vue'
import FxPanel from '@/components/panels/FxPanel.vue'
import PadGrid from '@/components/PadGrid.vue'
import StepGrid from '@/components/StepGrid.vue'
import TransportBar from '@/components/TransportBar.vue'
</script>
