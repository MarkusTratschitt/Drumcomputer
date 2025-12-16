<template lang="pug">
v-card
  v-card-title MIDI
  v-card-text
    p(v-if="!supports") Web MIDI not supported in this browser.
    template(v-else)
      v-btn(color="primary" @click="$emit('request')") Request Access
      v-select(
        class="mt-3"
        :items="inputs"
        item-title="name"
        item-value="id"
        label="MIDI Input"
        :model-value="selectedInputId"
        @update:model-value="onInput"
      )
      v-select(
        class="mt-3"
        :items="outputs"
        item-title="name"
        item-value="id"
        label="MIDI Output"
        :model-value="selectedOutputId"
        @update:model-value="onOutput"
      )
      v-row(class="mt-2" dense)
        v-col(cols="6")
          v-select(
            :items="padItems"
            item-title="title"
            item-value="value"
            label="Pad"
            v-model="pad"
          )
        v-col(cols="6")
          v-text-field(label="Note" type="number" v-model.number="noteNumber" min="0" max="127" @change="emitMapping")
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import type { MidiDeviceInfo } from '~/types/midi'

export default defineComponent({
  name: 'MidiPanel',
  props: {
    inputs: { type: Array as () => MidiDeviceInfo[], required: true },
    outputs: { type: Array as () => MidiDeviceInfo[], required: true },
    supports: { type: Boolean, required: true },
    selectedInputId: { type: String, required: false },
    selectedOutputId: { type: String, required: false }
  },
  emits: ['request', 'input', 'output', 'map'],
  data() {
    const padItems = Array.from({ length: 16 }).map((_, index) => {
      const id = `pad${index + 1}`
      return { title: id.toUpperCase(), value: id }
    })
    return {
      padItems,
      pad: 'pad1',
      noteNumber: 36
    }
  },
  methods: {
    onInput(value: string) {
      this.$emit('input', value)
    },
    onOutput(value: string) {
      this.$emit('output', value)
    },
    emitMapping() {
      this.$emit('map', { padId: this.pad, note: Number(this.noteNumber) })
    }
  }
})
</script>
