<template lang="pug">
v-card
  v-card-title Step Grid
  v-card-text
    .step-grid
      .step-row(v-for="pad in padOrder" :key="pad")
        v-btn(
          v-for="stepIndex in totalSteps"
          :key="`${pad}-${stepIndex}`"
          :color="buttonColor(pad, stepIndex - 1)"
          size="small"
          @click="toggle(pad, stepIndex - 1)"
        ) {{ stepIndex }}
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import type { GridSpec } from '~/types/time'
import type { DrumPadId, StepGrid } from '~/types/drums'

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
    }
  },
  methods: {
    isActive(padId: DrumPadId, stepIndex: number) {
      const barIndex = Math.floor(stepIndex / this.gridSpec.division)
      const stepInBar = stepIndex % this.gridSpec.division
      return Boolean(this.steps[barIndex]?.[stepInBar]?.[padId])
    },
    isCurrent(stepIndex: number) {
      return this.currentStep === stepIndex
    },
    buttonColor(padId: DrumPadId, stepIndex: number) {
      if (this.isActive(padId, stepIndex)) {
        return this.isCurrent(stepIndex) ? 'deep-purple-accent-3' : 'primary'
      }
      return this.isCurrent(stepIndex) ? 'info' : 'grey'
    },
    toggle(padId: DrumPadId, stepIndex: number) {
      const barIndex = Math.floor(stepIndex / this.gridSpec.division)
      const stepInBar = stepIndex % this.gridSpec.division
      this.$emit('step:toggle', { barIndex, stepInBar, padId })
    }
  }
})
</script>
