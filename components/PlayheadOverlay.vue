<template lang="pug">
  client-only(tag="div")
    div.playhead-overlay(
      :style="overlayStyle"
      :class="{ 'is-active': isPlaying }"
    )
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import type { CSSProperties } from 'vue'

export default defineComponent({
  name: 'PlayheadOverlay',

  props: {
    currentStep: {
      type: Number,
      required: true
    },
    totalSteps: {
      type: Number,
      required: true
    },
    isPlaying: {
      type: Boolean,
      required: true
    }
  },

  computed: {
    safeTotalSteps(): number {
      return Math.max(this.totalSteps, 1)
    },

    stepWidth(): number {
      return 100 / this.safeTotalSteps
    },

    normalizedStep(): number {
      const steps = this.safeTotalSteps
      return ((this.currentStep % steps) + steps) % steps
    },

    overlayStyle(): CSSProperties {
      return {
        width: `${this.stepWidth}%`,
        left: `${this.normalizedStep * this.stepWidth}%`
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
  border-radius: @radius-xs;
  box-shadow: inset 0 0 12px fade(@color-accent-primary, 35%);
  z-index: 1;

  &.is-active {
    opacity: 1;
  }
}
</style>
