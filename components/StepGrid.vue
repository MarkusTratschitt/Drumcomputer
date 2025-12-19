<template lang="pug">
  client-only(tag="div")
    .step-grid-shell
      .step-row
        StepCell(
          v-for="stepIndex in totalSteps"
          :key="stepIndex"
          :display-label="String(stepIndex)"
          :is-active="isActive(stepIndex - 1)"
          :is-accent="isAccent(stepIndex - 1)"
          :is-current="isCurrent(stepIndex - 1)"
          @cell:toggle="emitToggle(stepIndex - 1)"
        )
        PlayheadOverlay(
          v-if="totalSteps > 0"
          :current-step="currentStepNormalized"
          :total-steps="totalSteps"
          :is-playing="isPlaying"
        )
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import StepCell from './StepCell.vue'
import PlayheadOverlay from './PlayheadOverlay.vue'
import type { GridSpec } from '@/types/time'
import type { DrumPadId, StepGrid } from '@/types/drums'
import { ACCENT_STEP_VELOCITY } from '@/domain/velocity'

export default defineComponent({
  name: 'StepGrid',
  components: {
    StepCell,
    PlayheadOverlay
  },
  props: {
    gridSpec: { type: Object as () => GridSpec, required: true },
    steps: { type: Object as () => StepGrid, required: true },
    selectedPad: { type: String as () => DrumPadId | null, default: null },
    currentStep: { type: Number, required: true },
    isPlaying: { type: Boolean, required: true }
  },
  emits: ['step:toggle'],
  computed: {
    totalSteps(): number {
      return Math.max(0, this.gridSpec.bars * this.gridSpec.division)
    },
    currentStepNormalized(): number {
      const steps = Math.max(this.totalSteps, 1)
      return ((this.currentStep % steps) + steps) % steps
    }
  },
  methods: {
    resolveStepPosition(index: number): { barIndex: number; stepInBar: number } {
      const barIndex = Math.floor(index / this.gridSpec.division)
      const stepInBar = index % this.gridSpec.division
      return { barIndex, stepInBar }
    },

    emitToggle(index: number): void {
      if (!this.selectedPad) {
        return
      }

      const { barIndex, stepInBar } = this.resolveStepPosition(index)

      this.$emit('step:toggle', {
        barIndex,
        stepInBar,
        padId: this.selectedPad
      })
    },

    velocityAt(index: number): number | null {
      if (!this.selectedPad) {
        return null
      }

      const { barIndex, stepInBar } = this.resolveStepPosition(index)

      return (
        this.steps[barIndex]?.[stepInBar]?.[this.selectedPad]?.velocity?.value ??
        null
      )
    },

    isActive(index: number): boolean {
      return this.velocityAt(index) !== null
    },

    isAccent(index: number): boolean {
      const velocity = this.velocityAt(index)
      const ACCENT_EPSILON = 0.01

      return (
        velocity !== null &&
        velocity >= ACCENT_STEP_VELOCITY - ACCENT_EPSILON
      )
    },

    isCurrent(index: number): boolean {
      return index === this.currentStepNormalized
    }
  }
})
</script>

<style scoped lang="less">
.step-grid-shell {
  margin-top: 0;
  padding: 10px;
  background: #090c11;
  border: 1px solid #1d2430;
  border-radius: 16px;
  position: relative;
  height: 100%;
  max-height: 96px;
  overflow: visible;
}

.step-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(32px, 1fr));
  gap: 8px;
  position: relative;
  overflow: visible;

  >.playhead-overlay {
    pointer-events: none;
    z-index: 0;
  }

  >.step-cell {
    z-index: 1;
  }

  >.step-cell:nth-child(4n + 1) {
    border-left: 2px solid rgba(255, 255, 255, 0.12);
    padding-left: 12px;
  }
}

@media (max-height: 820px) {
  .step-grid-shell {
    max-height: 88px;
    padding: 8px;
  }
}
</style>
