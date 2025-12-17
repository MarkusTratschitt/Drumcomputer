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
    }
  }
})
</script>

<style scoped lang="less">
.pad-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  grid-template-rows: repeat(4, minmax(0, 1fr));
  gap: 10px;
  padding: 12px;
  background: #0a0d12;
  border-radius: 16px;
  border: 1px solid #1f2838;
  height: 100%;
}
</style>
