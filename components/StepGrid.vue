<template lang="pug">
v-card
  v-card-title Step Grid
  v-card-text
    .step-grid
      .step-row(v-for="pad in padOrder" :key="pad")
        v-btn(
          v-for="stepIndex in gridSpec.division"
          :key="`${pad}-${stepIndex}`"
          :color="isActive(pad, stepIndex - 1) ? 'primary' : 'grey'"
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
      'pad8'
    ]

    return {
      padOrder
    }
  },
  methods: {
    isActive(padId: DrumPadId, stepIndex: number) {
      const barIndex = Math.floor(stepIndex / this.gridSpec.division)
      const stepInBar = stepIndex % this.gridSpec.division
      return Boolean(this.steps[barIndex]?.[stepInBar]?.[padId])
    },
    toggle(padId: DrumPadId, stepIndex: number) {
      const barIndex = Math.floor(stepIndex / this.gridSpec.division)
      const stepInBar = stepIndex % this.gridSpec.division
      this.$emit('step:toggle', { barIndex, stepInBar, padId })
    }
  }
})
</script>
