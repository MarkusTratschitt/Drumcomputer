<template lang="pug">
button.step-cell(
  type="button"
  :class="cellClasses"
  @click="$emit('cell:toggle')"
  aria-pressed="isActive"
)
  span.step-tag {{ displayLabel }}
</template>

<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'StepCell',
  props: {
    displayLabel: { type: String, required: true },
    isActive: { type: Boolean, default: false },
    isAccent: { type: Boolean, default: false },
    isCurrent: { type: Boolean, default: false }
  },
  emits: ['cell:toggle'],
  computed: {
    cellClasses() {
      return {
        'is-active': this.isActive,
        'is-accent': this.isAccent,
        'is-current': this.isCurrent
      }
    }
  }
})
</script>

<style scoped lang="less">
.step-cell {
  border: none;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.04);
  color: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  padding: 8px 0;
  transition: background 0.2s ease, transform 0.1s ease, box-shadow 0.2s ease;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  width: 100%;
  height: 100%;
  box-sizing: border-box;

  &:not(.is-active):hover {
    background: rgba(120, 125, 140, 0.35);
  }

  &:active {
    transform: scale(0.97);
  }

  &.is-active {
    background: rgba(0, 255, 255, 0.15);
  }

  &.is-accent {
    background: linear-gradient(135deg, rgba(255, 180, 0, 0.25), rgba(255, 120, 0, 0.65));
  }

  &.is-current {
    box-shadow: inset 0 0 0 2px rgba(0, 255, 255, 0.9);
  }

  z-index: 1;
}

.step-tag {
  font-size: 0.7rem;
  letter-spacing: 0.08em;
}
</style>
