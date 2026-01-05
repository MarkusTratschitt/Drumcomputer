<template lang="pug">
v-card
  v-card-title Transport
  v-card-text
    v-row(align="center")
      v-col(cols="12" md="4")
        v-btn(color="primary" @click="$emit('play')" :disabled="isPlaying") Play
        v-btn(color="secondary" class="ml-2" @click="$emit('stop')" :disabled="!isPlaying") Stop
      v-col(cols="12" md="4")
        v-text-field(label="BPM" type="number" :model-value="bpm" @update:model-value="onBpm" min="40" max="240")
      v-col(cols="12" md="4")
        v-switch(label="Loop" color="primary" :model-value="loop" @update:model-value="onLoop")
    v-row
      v-col(cols="12" md="6")
        v-select(
          label="Division"
          :items="divisionItems"
          item-title="title"
          item-value="value"
          :model-value="division"
          @update:model-value="onDivision"
          hide-details
        )
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import type { TimeDivision } from '~/types/time'

export default defineComponent({
  name: 'TransportBar',
  props: {
    bpm: { type: Number, required: true },
    isPlaying: { type: Boolean, required: true },
    loop: { type: Boolean, required: true },
    division: { type: Number as () => TimeDivision, required: true },
    divisions: { type: Array as () => TimeDivision[], required: true }
  },
  emits: ['play', 'stop', 'bpm:update', 'loop:update', 'division:update'],
  computed: {
    divisionItems(): Array<{ title: string; value: TimeDivision }> {
      return this.divisions.map((value) => ({
        title: `1/${value}`,
        value
      }))
    }
  },
  methods: {
    onBpm(value: number | string) {
      const numeric = Number(value)
      if (!Number.isNaN(numeric)) {
        this.$emit('bpm:update', numeric)
      }
    },
    onLoop(value: boolean) {
      this.$emit('loop:update', value)
    },
    onDivision(value: TimeDivision | null) {
      if (value) {
        this.$emit('division:update', value)
      }
    }
  }
})
</script>
