<template lang="pug">
.pad-grid
  PadCell(
    v-for="pad in pads"
    :key="pad"
    :pad-id="pad"
    :label="padLabel(pad)"
    :is-selected="selectedPad === pad"
    :is-triggered="padStates[pad]?.isTriggered ?? false"
    :is-playing="padStates[pad]?.isPlaying ?? false"
    @pad:down="$emit('pad:down', $event)"
    @pad:select="$emit('pad:select', $event)"
  )
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import PadCell from './PadCell.vue'
import type { DrumPadId } from '~/types/drums'

type PadState = {
  label: string
  isTriggered: boolean
  isPlaying: boolean
}

export default defineComponent({
  name: 'PadGrid',
  components: { PadCell },
  props: {
    pads: { type: Array as () => DrumPadId[], required: true },
    selectedPad: { type: String as () => DrumPadId | null, default: null },
    padStates: {
      type: Object as () => Partial<Record<DrumPadId, PadState>>,
      default: () => ({})
    }
  },
  emits: ['pad:down', 'pad:select'],
  methods: {
    padLabel(pad: DrumPadId) {
      return this.padStates[pad]?.label ?? pad.toUpperCase()
    },

    moveSelection(offset: number) {
      if (!this.selectedPad) return

      const index = this.pads.indexOf(this.selectedPad)
      if (index === -1) return

      const nextIndex = index + offset
      if (nextIndex < 0 || nextIndex >= this.pads.length) return

      const nextPad = this.pads[nextIndex]
      this.$emit('pad:select', nextPad)
    }
  }
})
</script>

<style scoped lang="less">
.pad-grid(
  role="grid"
  @keydown.arrow-up.prevent="moveSelection(-4)"
  @keydown.arrow-down.prevent="moveSelection(4)"
  @keydown.arrow-left.prevent="moveSelection(-1)"
  @keydown.arrow-right.prevent="moveSelection(1)"
)
  PadCell(
    v-for="pad in pads"
    :key="pad"
    :pad-id="pad"
    :label="padLabel(pad)"
    :is-selected="selectedPad === pad"
    :is-triggered="padStates[pad]?.isTriggered ?? false"
    :is-playing="padStates[pad]?.isPlaying ?? false"
    @pad:down="$emit('pad:down', $event)"
    @pad:select="$emit('pad:select', $event)"
  )

</style>
