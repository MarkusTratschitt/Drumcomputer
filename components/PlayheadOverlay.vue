<template lang="pug">
  div.playhead-overlay(
    v-if="totalSteps > 0"
    :style="overlayStyle"
    :class="{ 'is-playing': isPlaying }"
  )
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import type { CSSProperties } from 'vue'

export default defineComponent({
  name: 'PlayheadOverlay',
  props: {
    currentStep: { type: Number, required: true },
    totalSteps: { type: Number, required: true },
    isPlaying: { type: Boolean, required: true }
  },
  computed: {
    safeTotalSteps(): number {
      return Math.max(this.totalSteps, 1)
    },
    clampedStep(): number {
      const maxIndex = this.safeTotalSteps - 1
      // clamp defensively in case parent passes out-of-range indices
      return Math.min(Math.max(0, this.currentStep), maxIndex)
    },
    stepWidthPercent(): number {
      return 100 / this.safeTotalSteps
    },
    overlayStyle(): CSSProperties {
      return {
        '--step-count': `${this.safeTotalSteps}`,
        '--step-index': `${this.clampedStep}`
      }
    }
  }
})
</script>

<style scoped lang="less">
@import '@/styles/variables.less';

.playhead-overlay {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  --grid-gap: 8px;
  --step-count: 1;
  --step-index: 0;
  width: calc(
    (100% - (var(--grid-gap) * (var(--step-count) - 1))) / var(--step-count)
  );
  left: calc(
    var(--step-index) *
      (
        (100% - (var(--grid-gap) * (var(--step-count) - 1))) / var(--step-count) +
          var(--grid-gap)
      )
  );
  background: transparent;
  pointer-events: none;
  border-radius: @radius-xs;
  box-shadow:
    inset 0 0 0 1px fade(@color-accent-primary, 28%),
    inset 0 0 0 2px fade(@color-accent-primary, 12%);
  opacity: 0.97;
  transition: none;

  &.is-playing {
    transition: left 120ms linear;
  }

  &::before {
    content: '';
    position: absolute;
    top: 10%;
    bottom: 10%;
    left: 0;
    right: 0;
    margin: auto;
    background: linear-gradient(
      90deg,
      fade(@color-accent-primary, 0%) 0%,
      fade(@color-accent-primary, 28%) 45%,
      fade(@color-accent-primary, 46%) 50%,
      fade(@color-accent-primary, 28%) 55%,
      fade(@color-accent-primary, 0%) 100%
    );
    box-shadow:
      0 0 10px fade(@color-accent-primary, 30%),
      0 0 18px fade(@color-accent-primary, 16%),
      inset 0 0 8px fade(@color-accent-primary, 20%);
  }
}
</style>
