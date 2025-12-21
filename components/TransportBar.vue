<template lang="pug">
client-only(tag="div")
  .transport-bar
    .row.controls
      v-btn(icon :disabled="isPlaying" color="primary" @click="$emit('play')" aria-label="Play")
        v-icon mdi-play
      v-btn(icon :disabled="!isPlaying" color="error" @click="$emit('stop')" aria-label="Stop")
        v-icon mdi-stop
      v-spacer
      v-btn(
        icon
        :color="isMidiLearning ? 'cyan' : 'grey'"
        variant="tonal"
        @click="$emit('toggle-midi-learn')"
        :aria-pressed="isMidiLearning"
        aria-label="Toggle MIDI learn"
      )
        v-icon mdi-midi

    .section
      .row.param
        v-btn(icon density="compact" variant="tonal" @click="$emit('decrement-bpm')" aria-label="BPM down")
          v-icon mdi-minus
        v-text-field(
          density="compact"
          type="number"
          class="bpm-input"
          label="BPM"
          :model-value="bpm"
          @update:model-value="onBpm"
          min="40"
          max="240"
          hide-details
        )
        v-btn(icon density="compact" variant="tonal" @click="$emit('increment-bpm')" aria-label="BPM up")
          v-icon mdi-plus

    .section
      v-select(
        density="compact"
        class="division-select"
        label="Division"
        :items="divisionItems"
        item-title="title"
        item-value="value"
        :model-value="division"
        @update:model-value="onDivision"
        hide-details
      )

    .section.bottom
      v-btn(
        class="loop-toggle"
        block
        :color="loop ? 'cyan' : 'grey'"
        variant="tonal"
        @click="toggleLoop"
        aria-label="Loop"
      )
        v-icon(:class="{ 'mdi-spin': loop }") mdi-repeat
        span.loop-text Loop
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
    divisions: { type: Array as () => TimeDivision[], required: true },
    isMidiLearning: { type: Boolean, default: false }
  },

  emits: [
    'play',
    'stop',
    'update-bpm',
    'increment-bpm',
    'decrement-bpm',
    'update-loop',
    'update-division',
    'toggle-midi-learn'
  ],

  computed: {
    divisionItems(): Array<{ title: string; value: TimeDivision }> {
      return this.divisions.map((value) => ({ title: `1/${value}`, value }))
    }
  },

  methods: {
    onBpm(value: number | string) {
      const numeric = Number(value)
      if (!Number.isNaN(numeric)) {
        this.$emit('update-bpm', numeric)
      }
    },
    onDivision(value: TimeDivision | null) {
      if (value != null) {
        this.$emit('update-division', value)
      }
    },
    toggleLoop() {
      this.$emit('update-loop', !this.loop)
    }
  }
})
</script>

<style scoped lang="less">
@import '@/styles/variables.less';

.transport-bar {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: @space-s;

  background: @color-surface-1;
  border: 1px solid @color-border-1;
  border-radius: @radius-m;
  padding: @space-s;

  /* "device panel" feeling */
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), inset 0 -2px 6px rgba(0,0,0,0.65);
}

.row {
  display: flex;
  align-items: center;
  gap: @space-xs;
}

.section {
  padding-top: @space-xs;
  border-top: 1px solid fade(@color-border-1, 55%);
}

.controls {
  padding-bottom: @space-xs;
}

.param .bpm-input {
  flex: 1 1 auto;
  min-width: 0;
}

.bpm-input,
.division-select {
  :deep(.v-field) {
    background: @color-surface-2;
    border-radius: @radius-s;
  }
  :deep(.v-label) {
    color: @color-text-muted;
    letter-spacing: @letter-spacing-tight;
  }
  :deep(input) {
    color: @color-text-primary;
  }
}

.loop-toggle {
  border-radius: @radius-s;
  border: 1px solid @color-border-2;
}

.loop-text {
  margin-left: @space-xs;
  font-size: @font-size-s;
  letter-spacing: @letter-spacing-wide;
  color: @color-text-secondary;
}

.bottom {
  margin-top: auto;
}
</style>
