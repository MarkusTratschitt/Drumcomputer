<template lang="pug">
.step-grid-shell
  .step-row
    StepCell(
      v-for="index in totalSteps"
      :key="index"
      :display-label="String(index)"
      :is-active="isActive(index - 1)"
      :is-accent="isAccent(index - 1)"
      :is-current="isCurrent(index - 1)"
      @cell:toggle="emitToggle(index - 1)"
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
import type { GridSpec } from '~/types/time'
import type { DrumPadId, StepGrid } from '~/types/drums'
import { ACCENT_STEP_VELOCITY } from '~/domain/velocity'

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
      return this.gridSpec.bars * this.gridSpec.division
    },
    currentStepNormalized(): number {
      const steps = Math.max(this.totalSteps, 1)
      return ((this.currentStep % steps) + steps) % steps
    }
  },
  methods: {
    emitToggle(index: number) {
      const barIndex = Math.floor(index / this.gridSpec.division)
      const stepInBar = index % this.gridSpec.division
      if (this.selectedPad) {
        this.$emit('step:toggle', { barIndex, stepInBar, padId: this.selectedPad })
      }
    },
    velocityAt(index: number): number | undefined {
      if (!this.selectedPad) {
        return undefined
      }
      const barIndex = Math.floor(index / this.gridSpec.division)
      const stepInBar = index % this.gridSpec.division
      return this.steps[barIndex]?.[stepInBar]?.[this.selectedPad]?.velocity?.value
    },
    isActive(index: number) {
      return Boolean(this.velocityAt(index))
    },
    isAccent(index: number) {
      const velocity = this.velocityAt(index)
      return velocity !== undefined && velocity >= ACCENT_STEP_VELOCITY - 0.01
    },
    isCurrent(index: number) {
      return index === this.currentStepNormalized
    },
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

  .step-cell:nth-child(4n + 1) {
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
