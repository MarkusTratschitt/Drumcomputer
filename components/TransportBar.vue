<template lang="pug">
  client-only(tag="div")
    v-app-bar(dense flat class="transport-bar")
      .transport-controls
        v-btn(icon :disabled="isPlaying" color="primary" @click="$emit('play')" aria-label="Play")
          v-icon mdi-play
        v-btn(icon :disabled="!isPlaying" color="error" @click="$emit('stop')" aria-label="Stop")
          v-icon mdi-stop
      .transport-parameters
        v-text-field(
          dense
          type="number"
          class="bpm-input"
          label="BPM"
          :model-value="bpm"
          @update:model-value="onBpm"
          min="40"
          max="240"
          hide-details
        )
        v-select(
          dense
          class="division-select"
          label="Division"
          :items="divisionItems"
          item-title="title"
          item-value="value"
          :model-value="division"
          @update:model-value="onDivision"
          hide-details
        )
        v-btn(icon class="loop-toggle" :color="loop ? 'cyan' : 'grey'" @click="toggleLoop" aria-label="Loop")
        v-icon(:class="{ 'mdi-spin': loop }") mdi-repeat
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import type { TimeDivision } from '@/types/time'

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
    onDivision(value: TimeDivision | null) {
      if (value) {
        this.$emit('division:update', value)
      }
    },
    toggleLoop() {
      this.$emit('loop:update', !this.loop)
    }
  }
})
</script>

<style scoped lang="less">
.transport-bar {
  background: @color-surface-2;
  border: 1px solid @color-border-2;
  border-radius: @radius-m;
  padding: 0 @space-s;
  gap: @space-s;
  height: 100%;
  position: static;
  box-shadow: none;

  .transport-controls {
   display: flex;
   gap: @space-xs;
  }

  .transport-parameters {
   display: flex;
   align-items: center;
   gap: @space-m;
   margin-left: auto;
  }

  .bpm-input,
  .division-select {
    max-width: 120px;
  }

  .loop-toggle {
   border-radius: @radius-s;
   border: 1px solid @color-border-2;
  }
}
</style>
