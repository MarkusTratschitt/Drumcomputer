<template lang="pug">
v-card
  v-card-title Transport
  v-card-text
    v-row(align="center")
      v-col(cols="12" md="4")
        v-btn(color="primary" @click="$emit('play')" :disabled="isPlaying") Play
        v-btn(color="secondary" class="ml-2" @click="$emit('stop')" :disabled="!isPlaying") Stop
      v-col(cols="12" md="4")
        v-text-field(label="BPM" type="number" :model-value="bpm" @update:model-value="onBpm")
      v-col(cols="12" md="4")
        v-switch(label="Loop" color="primary" v-model="loop")
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'TransportBar',
  props: {
    bpm: { type: Number, required: true },
    isPlaying: { type: Boolean, required: true }
  },
  emits: ['play', 'stop', 'bpm:update'],
  data() {
    return {
      loop: true
    }
  },
  methods: {
    onBpm(value: number | string) {
      const numeric = Number(value)
      if (!Number.isNaN(numeric)) {
        this.$emit('bpm:update', numeric)
      }
    }
  }
})
</script>
