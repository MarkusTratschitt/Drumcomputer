<template lang="pug">
  client-only(tag="div")
    button.step-cell(
      type="button"
      :class="cellClasses"
      :aria-pressed="isActive"
      @click="onToggle"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerCancel"
    )
      span.step-tag {{ displayLabel }}
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'StepCell',
  props: {
    isAccent: { type: Boolean, default: false },
    isActive: { type: Boolean, default: false },
    isCurrent: { type: Boolean, default: false },
    displayLabel: { type: String, default: '' }
  },
  emits: [
    'cell:toggle',
    'cell:pointerdown',
    'cell:pointermove',
    'cell:pointerup',
    'cell:pointercancel'
  ],
  computed: {
    cellClasses(): Record<string, boolean> {
      return {
        'is-active': this.isActive,
        'is-accent': this.isAccent,
        'is-current': this.isCurrent
      }
    }
  },
  methods: {
    onToggle(): void {
      this.$emit('cell:toggle')
    },
    onPointerDown(event: PointerEvent): void {
      if (event.currentTarget instanceof HTMLElement) {
        event.currentTarget.setPointerCapture(event.pointerId)
      }
      this.$emit('cell:pointerdown', event)
    },
    onPointerMove(event: PointerEvent): void {
      this.$emit('cell:pointermove', event)
    },
    onPointerUp(event: PointerEvent): void {
      this.$emit('cell:pointerup', event)
    },
    onPointerCancel(event: PointerEvent): void {
      this.$emit('cell:pointercancel', event)
    }
  }
})
</script>

<style scoped lang="less">
@import '@/styles/variables.less';

.step-cell {
  border: none;
  border-radius: @radius-s;
  background: fade(@color-accent-primary, 15%);
  color: @color-text-primary;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: @font-size-xs;
  padding: @space-xs 0;
  transition: background 0.2s ease, transform 0.1s ease, box-shadow 0.2s ease;
  position: relative;
  cursor: pointer;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  z-index: 1;

  &:not(.is-active):hover {
    background: fade(@color-accent-primary, 25%);
  }

  &:active {
    transform: scale(0.97);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px fade(@color-accent-primary, 60%);
  }

  &.is-active {
    background: fade(@color-accent-primary, 15%);
  }

  &.is-accent {
    background: linear-gradient(
      135deg,
      fade(@color-accent-warning, 25%),
      fade(@color-accent-warning, 65%)
    );
  }

  &.is-active.is-accent {
    background: linear-gradient(
      135deg,
      fade(@color-accent-warning, 35%),
      fade(@color-accent-primary, 35%)
    );
  }

  &.is-current {
    box-shadow: inset 0 0 0 2px fade(@color-accent-primary, 90%);
  }

  &.is-accent.is-current {
    box-shadow:
      inset 0 0 0 2px fade(@color-accent-warning, 85%),
      0 0 12px fade(@color-accent-warning, 32%);
    animation: accent-scan-pulse 160ms ease-out 1;
  }
}

.step-tag {
  font-size: @font-size-xs;
  letter-spacing: @letter-spacing-tight;
}

@keyframes accent-scan-pulse {
  from {
    transform: scale(1.02);
    box-shadow:
      inset 0 0 0 2px fade(@color-accent-warning, 95%),
      0 0 16px fade(@color-accent-warning, 38%);
  }
  to {
    transform: scale(1);
    box-shadow:
      inset 0 0 0 2px fade(@color-accent-warning, 85%),
      0 0 12px fade(@color-accent-warning, 32%);
  }
}
</style>
