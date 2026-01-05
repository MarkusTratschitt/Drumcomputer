<template lang="pug">
v-card
  v-card-title Pads
  v-card-text
    .pad-grid
      v-btn(v-for="pad in pads" :key="pad" color="primary" block @click="$emit('pad:down', pad)") {{ pad }}
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import type { DrumPadId } from '~/types/drums'

export default defineComponent({
  name: 'PadGrid',
  props: {
    pads: { type: Array as () => DrumPadId[], required: true }
  },
  emits: ['pad:down']
})
</script>
