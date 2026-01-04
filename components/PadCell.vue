<template lang="pug">
  button.pad-cell(
    type="button"
    :class="padClasses"
    :title="padHint"
    :aria-label="padHint"
    :style="padStyle"
    @pointerdown.prevent="handleActivate"
    @click.prevent="handleActivate"
    @keydown.enter.prevent="handleActivate"
    @keydown.space.prevent="handleActivate"
    :aria-pressed="isSelected"
  )
    span.pad-label {{ label }}
    span.pad-key(v-if="keyLabel") {{ keyLabel }}
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import type { DrumPadId } from '@/types/drums'
// Represents a single drum pad cell, emitting pad hits and selection while reflecting trigger/play states.

export default defineComponent({
  name: 'PadCell',
  props: {
    padId: { type: String as () => DrumPadId, required: true },
    label: { type: String, required: true },
    isSelected: { type: Boolean, default: false },
    isTriggered: { type: Boolean, default: false },
    isPlaying: { type: Boolean, default: false },
    isEmpty: { type: Boolean, default: false },
    keyLabel: { type: String, default: null },
    padColor: { type: String, default: '#12c8ff' }
  },
  emits: ['pad:down', 'pad:select'],
  computed: {
    padClasses(): Record<string, boolean> {
      return {
        'is-selected': this.isSelected,
        'is-triggered': this.isTriggered,
        'is-playing': this.isPlaying,
        'is-empty': this.isEmpty
      }
    },

    padHint(): string {
      const key = this.keyLabel ? ` (${this.keyLabel})` : ''
      return `${this.label}${key} – click or press to trigger/select`
    },

    padStyle(): Record<string, string> {
      return {
        '--pad-color-base': this.padColor
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
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  color: @color-text-primary;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--pad-color-base, #12c8ff) 80%, #ffffff 20%),
    color-mix(in srgb, var(--pad-color-base, #12c8ff) 85%, #000000 15%)
  );
  border: 1px solid #2c3342;
  border-radius: @radius-s;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.08),
    0 6px 14px rgba(0,0,0,0.45);
}

.pad-cell.is-empty {
  background-color: #f2f1e8;
  border-color: #d6d4c8;
}

.pad-cell.is-selected {
  border-color: @color-border-3;

  box-shadow:
    0 0 0 2px fade(@color-border-3, 25%),
    @shadow-box;
}

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

.pad-cell:not(.is-empty).is-triggered::after {
  box-shadow: 0 0
    calc(10px * var(--pad-velocity))
    fade(@color-accent-primary, 40%);
}

.pad-cell.is-triggered:not(.is-playing) {
  background: linear-gradient(
    180deg,
    fade(@color-text-primary, 90%),
    fade(@color-text-primary, 65%)
  );
}

.pad-cell:active {
  transform: translateY(1px);
  box-shadow:
    inset 0 3px 6px rgba(0,0,0,0.8);
}

.pad-label {
  font-weight: 600;
  letter-spacing: 0.04em;
  color: #fefefe;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
}

.pad-cell.is-playing {
  background: linear-gradient(
    180deg,
    fade(@color-accent-primary, 90%),
    fade(@color-accent-primary, 55%)
  );

  box-shadow:
    0 0 calc(18px * var(--pad-velocity))
      fade(@color-accent-primary, 70%),
    @shadow-box;
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
