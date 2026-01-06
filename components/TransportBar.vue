<template lang="pug">
client-only(tag="div")
  .transport-bar
    .transport-grid
      button.control-btn(type="button")
        span.control-btn__main RESTART
        span.control-btn__sub Loop
      button.control-btn(type="button")
        span.control-btn__main ERASE
        span.control-btn__sub Replace
      button.control-btn(type="button")
        span.control-btn__main TAP
        span.control-btn__sub Metro
      button.control-btn(type="button")
        span.control-btn__main FOLLOW
        span.control-btn__sub Grid
      button.control-btn(type="button")
        span.control-btn__main PLAY
      button.control-btn(type="button")
        span.control-btn__main REC
        span.control-btn__sub Count In
      button.control-btn(type="button")
        span.control-btn__main STOP
      button.control-btn(type="button")
        .shift-label SHIFT
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
    'update-loop-end',
    'update:metronome-volume',
    'toggle-live-erase',
    'erase-pad',
    'erase-current-step',
    'update:preset-bars',
    'update:preset-division',
    'apply-pattern-preset'
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
  width: 100%;
  display: flex;
  flex-direction: column;
  background: @color-surface-1;
  border: 1px solid @color-border-1;
  border-radius: @radius-m;
  padding: @space-s;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), inset 0 -2px 6px rgba(0,0,0,0.65);
}

.transport-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(2, var(--edit-btn-h, clamp(34px, 4.2vh, 44px)));
  gap: @space-xxs;
  width: 100%;
}

.control-btn {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid fade(#3b4355, 65%);
  background: linear-gradient(180deg, #1c2230, #121826);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
  color: rgba(255, 255, 255, 0.88);
  line-height: 1.05;
  text-align: left;
  min-height: 44px;
  max-width: 50%;
}

.control-btn__main {
  font-weight: 800;
  letter-spacing: 0.06em;
  font-size: 12px;
  text-transform: uppercase;
}

.control-btn__sub {
  margin-top: 2px;
  font-weight: 400;
  font-style: italic;
  opacity: 0.75;
  font-size: 11px;
  letter-spacing: 0.02em;
  text-transform: none;
}

.shift-label {
  height: 14px;
  background: #fff;
  color: #000;
  font-weight: 800;
  font-size: 12px;
  letter-spacing: 0.06em;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  border-radius: 4px;
}
</style>
