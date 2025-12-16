<template lang="pug">
v-card
  v-card-title MIDI
  v-card-text
    p(v-if="!supports") Web MIDI not supported in this browser.
    template(v-else)
      v-btn(color="primary" @click="$emit('request')") Request Access
      v-select(:items="devices" item-title="name" item-value="id" label="MIDI Inputs")
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import type { MidiDeviceInfo } from '~/types/midi'

export default defineComponent({
  name: 'MidiPanel',
  props: {
    devices: { type: Array as () => MidiDeviceInfo[], required: true },
    supports: { type: Boolean, required: true }
  },
  emits: ['request']
})
</script>
