<template lang="pug">
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
.pad-cell {
  border-radius: 12px;
  border: 2px solid transparent;
  background: linear-gradient(135deg, #12151b, #1c2130);
  color: #f5f7fb;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.3s ease;
  position: relative;
  overflow: visible;

  &:active {
    transform: scale(0.97);
    box-shadow: inset 0 0 12px rgba(0, 0, 0, 0.8);
  }

  &.is-selected {
    border-color: #00f8ff;
  }

  &.is-playing {
    animation: padPulse 2s ease-in-out infinite;
  }

  &:focus-visible {
    outline: 2px solid #00f8ff;
    outline-offset: 2px;
  }


  &.is-triggered {
    &:after {
      content: '';
      position: absolute;
      inset: 4px;
      border-radius: 10px;
      border: 2px solid rgba(0, 255, 255, 0.9);
      animation: triggerFlash 0.35s ease-out;
    }
  }
}

.pad-label {
  pointer-events: none;
}

@keyframes triggerFlash {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
    transform: scale(1.1);
  }
}

@keyframes padPulse {
  0% {
    box-shadow: 0 0 0 0 rgba(0, 255, 255, 0.15);
  }
  50% {
    box-shadow: 0 0 12px 6px rgba(0, 255, 255, 0.2);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(0, 255, 255, 0);
  }
}
</style>
