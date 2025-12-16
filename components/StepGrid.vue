<template lang="pug">
v-card
  v-card-title Step Grid
  v-card-text
    .step-grid
      .step-row(v-for="pad in padOrder" :key="pad" :style="stepRowStyle")
        v-btn(
          v-for="stepIndex in totalSteps"
          :key="`${pad}-${stepIndex}`"
          :color="buttonColor(pad, stepIndex - 1)"
          :style="buttonStyle(pad, stepIndex - 1)"
          size="small"
          @click="toggle(pad, stepIndex - 1)"
        ) {{ stepLabel(stepIndex, pad, stepIndex - 1) }}
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import type { GridSpec } from '~/types/time'
import type { DrumPadId, StepGrid } from '~/types/drums'
import { ACCENT_STEP_VELOCITY, velocityToIntensity } from '~/domain/velocity'

export default defineComponent({
  name: 'StepGrid',
  props: {
    gridSpec: { type: Object as () => GridSpec, required: true },
    steps: { type: Object as () => StepGrid, required: true },
    currentStep: { type: Number, required: true }
  },
  emits: ['step:toggle'],
  data() {
    const padOrder: DrumPadId[] = [
      'pad1',
      'pad2',
      'pad3',
      'pad4',
      'pad5',
      'pad6',
      'pad7',
      'pad8',
      'pad9',
      'pad10',
      'pad11',
      'pad12',
      'pad13',
      'pad14',
      'pad15',
      'pad16'
    ]

    return {
      padOrder
    }
  },
  computed: {
    totalSteps(): number {
      return this.gridSpec.bars * this.gridSpec.division
    },
    stepRowStyle(): Record<string, string> {
      return { '--step-columns': String(this.totalSteps) }
    }
  },
  methods: {
    stepVelocity(padId: DrumPadId, stepIndex: number): number | undefined {
      const barIndex = Math.floor(stepIndex / this.gridSpec.division)
      const stepInBar = stepIndex % this.gridSpec.division
      return this.steps[barIndex]?.[stepInBar]?.[padId]?.velocity?.value
    },
    isActive(padId: DrumPadId, stepIndex: number) {
      return Boolean(this.stepVelocity(padId, stepIndex))
    },
    isCurrent(stepIndex: number) {
      return this.currentStep === stepIndex
    },
    buttonColor(padId: DrumPadId, stepIndex: number) {
      const velocity = this.stepVelocity(padId, stepIndex)
      if (this.isActive(padId, stepIndex)) {
        const accent = (velocity ?? 0) >= ACCENT_STEP_VELOCITY - 0.01
        if (accent) {
          return this.isCurrent(stepIndex) ? 'deep-orange-accent-2' : 'amber-darken-2'
        }
        return this.isCurrent(stepIndex) ? 'light-blue-accent-3' : 'primary'
      }
      return this.isCurrent(stepIndex) ? 'info' : 'grey'
    },
    buttonStyle(padId: DrumPadId, stepIndex: number) {
      const intensity = velocityToIntensity(this.stepVelocity(padId, stepIndex))
      return intensity > 0 ? { opacity: String(0.5 + intensity * 0.5) } : {}
    },
    stepLabel(displayIndex: number, padId: DrumPadId, stepIndex: number) {
      const velocity = this.stepVelocity(padId, stepIndex) ?? 0
      if (!velocity) {
        return String(displayIndex)
      }
      if (velocity >= ACCENT_STEP_VELOCITY - 0.01) {
        return `${displayIndex}!`
      }
      if (velocity > 0.75) {
        return `${displayIndex}•`
      }
      return `${displayIndex}·`
    },
    toggle(padId: DrumPadId, stepIndex: number) {
      const barIndex = Math.floor(stepIndex / this.gridSpec.division)
      const stepInBar = stepIndex % this.gridSpec.division
      this.$emit('step:toggle', { barIndex, stepInBar, padId })
    }
  }
})
</script>
