<template lang="pug">
  client-only(tag="div")
    button.pad-cell(
      type="button"
      :class="padClasses"
      @pointerdown.prevent="handleActivate"
      @click.prevent="handleActivate"
      @keydown.enter.prevent="handleActivate"
      @keydown.space.prevent="handleActivate"
      :aria-pressed="isSelected"
    )
    span.pad-label {{ label }}
    span.pad-key {{ keyLabel }}
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import type { DrumPadId } from '@/types/drums'

export default defineComponent({
  name: 'PadCell',
  props: {
    padId: { type: String as () => DrumPadId, required: true },
    label: { type: String, required: true },
    isSelected: { type: Boolean, default: false },
    isTriggered: { type: Boolean, default: false },
    isPlaying: { type: Boolean, default: false }
  },
  emits: ['pad:down', 'pad:select'],
  computed: {
    padClasses(): Record<string, boolean> {
      return {
        'is-selected': this.isSelected,
        'is-triggered': this.isTriggered,
        'is-playing': this.isPlaying
      }
    }
  },
  methods: {
    handleActivate() {
      this.$emit('pad:down', this.padId)
      this.$emit('pad:select', this.padId)
    }
  }
})
</script>

<style scoped lang="less">
@import '@/styles/variables.less';

.pad-cell {
  /* Basis */
  background-color: #1a2230; /* geladen, neutral blau */
  border: 1px solid @color-border-2;
  transition: background-color 0.08s linear, box-shadow 0.08s linear;
}

.pad-label {
  font-size: 12px;
  opacity: 0.75;
  pointer-events: none;
  user-select: none;
}

/* ───────── Unbelegt ───────── */
.pad-cell.is-empty {
  background-color: #f2f1e8; /* weiß mit minimalem Gelbstich */
  border-color: #d6d4c8;
}

/* Fokus & Auswahl bleiben wie bei dir definiert */
.pad-cell.is-selected {
  border-color: @color-accent-primary;
}

/* ───────── Trigger / Velocity ───────── */
/* Je höher Velocity, desto dunkler */
.pad-cell.is-triggered {
  background-color: ~"color-mix(
    in srgb,
    @color-surface-1 calc(100% - (var(--pad-velocity) * 60%)),
    #000000
  )";
}

.pad-cell.is-triggered .pad-label {
  opacity: 0.85;
}

/* Optional: geladene Pads leicht abdunkeln bei Velocity */
.pad-cell:not(.is-empty).is-triggered::after {
  box-shadow: 0 0
    calc(10px * var(--pad-velocity))
    fade(@color-accent-primary, 40%);
}

.pad-key {
  position: absolute;
  bottom: @space-xs;
  left: @space-xs;
  font-size: @font-size-xs;
  opacity: 0;
  pointer-events: none;
}

.pad-grid:focus-visible .pad-key {
  opacity: 0.35;
}
</style>
