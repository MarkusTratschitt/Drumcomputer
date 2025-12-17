<template lang="pug">
div.playhead-overlay(
  :style="overlayStyle"
  :class="{ 'is-active': isPlaying }"
)
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'PlayheadOverlay',
  props: {
    currentStep: { type: Number, required: true },
    totalSteps: { type: Number, required: true },
    isPlaying: { type: Boolean, required: true }
  },
  computed: {
    overlayStyle() {
      const cappedSteps = Math.max(this.totalSteps, 1)
      const normalizedStep = ((this.currentStep % cappedSteps) + cappedSteps) % cappedSteps
      const width = 100 / cappedSteps
      const left = normalizedStep * width
      return {
        width: `${width}%`,
        left: `${left}%`
      }
    }
  }
})
</script>

<style scoped lang="less">
.playhead-overlay {
  position: absolute;
  top: 0;
  bottom: 0;
  background: rgba(0, 255, 255, 0.15);
  mix-blend-mode: screen;
  transition: opacity 0.4s ease;
  opacity: 0;
  pointer-events: none;
  border-radius: 4px;
  box-shadow: inset 0 0 12px rgba(0, 255, 255, 0.35);
  z-index: 0;

  &.is-active {
    opacity: 1;
  }
}
</style>
