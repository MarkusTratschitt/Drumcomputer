<template lang="pug">
client-only(tag="div")
  .transport-bar
    .row.controls
      v-btn(icon :disabled="isPlaying" color="primary" @click="$emit('play')" aria-label="Play")
        v-icon mdi-play
      v-btn(icon :disabled="!isPlaying" color="error" @click="$emit('stop')" aria-label="Stop")
        v-icon mdi-stop
      v-btn(icon color="primary" variant="tonal" @click="$emit('restart')" aria-label="Restart loop")
        v-icon mdi-reload
      v-btn(
        icon
        :color="isRecording ? 'red' : 'grey'"
        variant="tonal"
        @click="$emit('toggle-record')"
        :aria-pressed="isRecording"
        aria-label="Record toggle"
      )
        v-icon mdi-record
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
      .row.stack
        v-btn(
          class="loop-toggle"
          :color="loop ? 'cyan' : 'grey'"
          variant="tonal"
          @click="toggleLoop"
          aria-label="Loop"
        )
          v-icon(:class="{ 'mdi-spin': loop }") mdi-repeat
          span.loop-text Loop
        v-btn(
          density="comfortable"
          variant="outlined"
          @click="$emit('nudge-loop-range', -1)"
          aria-label="Nudge loop left"
        ) ◀ Loop
        v-btn(
          density="comfortable"
          variant="outlined"
          @click="$emit('nudge-loop-range', 1)"
          aria-label="Nudge loop right"
        ) Loop ▶
      .row.param
        v-switch(
          density="compact"
          hide-details
          :model-value="countInEnabled"
          @update:model-value="$emit('toggle-count-in')"
          label="Count-in"
        )
        v-text-field(
          density="compact"
          type="number"
          class="count-in-input"
          label="Bars"
          min="1"
          max="8"
          :model-value="countInBars"
          @update:model-value="onCountInBars"
          hide-details
        )
        v-btn(
          density="comfortable"
          variant="tonal"
          :color="metronomeEnabled ? 'cyan' : 'grey'"
          @click="$emit('toggle-metronome')"
          :aria-pressed="metronomeEnabled"
          aria-label="Metronome"
        )
          v-icon mdi-metronome
        v-slider(
          class="metronome-volume"
          density="compact"
          hide-details
          min="0"
          max="1"
          step="0.02"
          thumb-label
          :model-value="metronomeVolume"
          @update:model-value="$emit('update:metronome-volume', $event)"
        )
        v-btn(
          density="comfortable"
          variant="tonal"
          :color="followEnabled ? 'cyan' : 'grey'"
          @click="$emit('toggle-follow')"
          :aria-pressed="followEnabled"
          aria-label="Follow playhead"
        )
          v-icon mdi-crosshairs-gps
        v-btn(
          density="comfortable"
          variant="text"
          @click="$emit('tap-tempo')"
          aria-label="Tap tempo"
        ) Tap
      .row.param
        v-select(
          density="compact"
          class="preset-division"
          label="Preset division"
          :items="divisionItems"
          item-title="title"
          item-value="value"
          :model-value="presetDivision"
          @update:model-value="$emit('update:preset-division', $event)"
          hide-details
        )
        v-text-field(
          density="compact"
          type="number"
          class="preset-bars"
          label="Preset bars"
          min="1"
          max="16"
          :model-value="presetBars"
          @update:model-value="$emit('update:preset-bars', $event)"
          hide-details
        )
        v-btn(
          density="comfortable"
          variant="outlined"
          @click="$emit('apply-pattern-preset')"
          aria-label="Apply pattern preset"
        ) Preset
      .row.param
        v-text-field(
          density="compact"
          type="number"
          class="pattern-bars"
          label="Pattern bars"
          min="1"
          max="16"
          :model-value="patternBars"
          @update:model-value="onPatternBars"
          hide-details
        )
      .row.param
        v-text-field(
          density="compact"
          type="number"
          class="loop-field"
          label="Loop start"
          min="0"
          :max="totalSteps - 1"
          :model-value="loopStart"
          @update:model-value="onLoopStart"
          hide-details
        )
        v-text-field(
          density="compact"
          type="number"
          class="loop-field"
          label="Loop end"
          min="1"
          :max="totalSteps"
          :model-value="loopEnd"
          @update:model-value="onLoopEnd"
          hide-details
        )
      .row.param
        v-btn(
          density="comfortable"
          variant="outlined"
          :color="liveEraseEnabled ? 'red' : 'grey'"
          @click="$emit('toggle-live-erase')"
          :aria-pressed="liveEraseEnabled"
        ) Live erase
        v-btn(
          density="comfortable"
          variant="text"
          :disabled="!selectedPad"
          @click="$emit('erase-pad')"
        ) Erase pad
        v-btn(
          density="comfortable"
          variant="text"
          :disabled="!selectedPad"
          @click="$emit('erase-current-step')"
        ) Erase step
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import type { TimeDivision } from '@/types/time'

export default defineComponent({
  name: 'TransportBar',
  // Provides playback controls plus BPM, division, loop, and MIDI learn toggles for the drum machine.
  props: {
    bpm: { type: Number, required: true },
    isPlaying: { type: Boolean, required: true },
    loop: { type: Boolean, required: true },
    division: { type: Number as () => TimeDivision, required: true },
    divisions: { type: Array as () => TimeDivision[], required: true },
    isMidiLearning: { type: Boolean, default: false },
    isRecording: { type: Boolean, default: false },
    countInEnabled: { type: Boolean, default: false },
    countInBars: { type: Number, default: 1 },
    metronomeEnabled: { type: Boolean, default: false },
    followEnabled: { type: Boolean, default: true },
    patternBars: { type: Number, default: 1 },
    loopStart: { type: Number, default: 0 },
    loopEnd: { type: Number, default: 1 },
    totalSteps: { type: Number, default: 1 },
    selectedPad: { type: String, default: null },
    liveEraseEnabled: { type: Boolean, default: false },
    metronomeVolume: { type: Number, default: 0.12 },
    presetBars: { type: Number, default: 1 },
    presetDivision: { type: Number, default: 4 }
  },

  emits: [
    'play',
    'stop',
    'stop-reset',
    'restart',
    'toggle-record',
    'update-bpm',
    'increment-bpm',
    'decrement-bpm',
    'update-loop',
    'update-division',
    'toggle-midi-learn',
    'toggle-count-in',
    'update-count-in-bars',
    'tap-tempo',
    'toggle-metronome',
    'toggle-follow',
    'update-pattern-bars',
    'nudge-loop-range',
    'update-loop-start',
    'update-loop-end'
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
    },
    onCountInBars(value: number | string) {
      const numeric = Number(value)
      if (!Number.isNaN(numeric)) {
        this.$emit('update-count-in-bars', numeric)
      }
    },
    onPatternBars(value: number | string) {
      const numeric = Number(value)
      if (!Number.isNaN(numeric)) {
        this.$emit('update-pattern-bars', numeric)
      }
    },
    onLoopStart(value: number | string) {
      const numeric = Number(value)
      if (!Number.isNaN(numeric)) {
        this.$emit('update-loop-start', numeric)
      }
    },
    onLoopEnd(value: number | string) {
      const numeric = Number(value)
      if (!Number.isNaN(numeric)) {
        this.$emit('update-loop-end', numeric)
      }
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

.stack {
  flex-wrap: wrap;
}

.count-in-input,
.pattern-bars {
  max-width: 120px;
}

.loop-field {
  max-width: 120px;
}

.metronome-volume {
  flex: 1 1 auto;
  min-width: 120px;
}

.preset-division {
  max-width: 140px;
}

.preset-bars {
  max-width: 120px;
}
</style>
