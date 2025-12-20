<template>
  <NuxtLayout name="default">
    <DrumMachine v-slot:main="main" v-slot:transport="transport" v-slot:pads="pads" v-slot:drawer="drawer">
      <template #main>
        <StepGrid
          :ref="main.stepGridProps.setRef"
          :grid-spec="main.stepGridProps.gridSpec"
          :steps="main.stepGridProps.steps"
          :selected-pad="main.stepGridProps.selectedPad"
          :current-step="main.stepGridProps.currentStep"
          :is-playing="main.stepGridProps.isPlaying"
          @step:toggle="main.stepGridProps.onToggleStep"
          @playhead:scrub="main.stepGridProps.onScrubPlayhead"
          @step:velocity="main.stepGridProps.onUpdateStepVelocity"
        />
      </template>

      <template #transport>
        <TransportBar
          :bpm="transport.transportProps.bpm"
          :is-playing="transport.transportProps.isPlaying"
          :loop="transport.transportProps.loop"
          :division="transport.transportProps.division"
          :divisions="transport.transportProps.divisions"
          :is-midi-learning="transport.transportProps.isMidiLearning"
          @play="transport.transportProps.onPlay"
          @stop="transport.transportProps.onStop"
          @bpm:update="transport.transportProps.onUpdateBpm"
          @bpm:increment="transport.transportProps.onIncrementBpm"
          @bpm:decrement="transport.transportProps.onDecrementBpm"
          @division:update="transport.transportProps.onUpdateDivision"
          @loop:update="transport.transportProps.onUpdateLoop"
          @midi-learn:toggle="transport.transportProps.onToggleMidiLearn"
        />
        <div class="midi-learn-status">
          {{ transport.midiLearnLabel }}
        </div>
      </template>

      <template #pads>
        <PadGrid
          :pads="pads.padGridProps.pads"
          :pad-states="pads.padGridProps.padStates"
          :selected-pad="pads.padGridProps.selectedPad"
          @pad:down="pads.padGridProps.onPadDown"
          @pad:select="pads.padGridProps.onPadSelect"
        />
      </template>

      <template #drawer>
        <FxPanel
          :fx-settings="drawer.fxProps.fxSettings"
          @fx:update="drawer.fxProps.onUpdateFx"
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
