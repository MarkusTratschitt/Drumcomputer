<template lang="pug">
  client-only(tag="div")
    button.step-cell(
      type="button"
      :class="cellClasses"
      :aria-pressed="isActive"
      @click="onToggle"
          box-shadow: 0 0 0 2px fade(@color-accent-primary, 60%);
    span.step-tag {{ displayLabel }}
</template>

          background: fade(@color-accent-primary, 15%);
import { defineComponent } from 'vue'

export default defineComponent({
          background: linear-gradient(
            135deg,
            fade(@color-accent-warning, 25%),
            fade(@color-accent-warning, 65%)
          );
      required: true
    },
    isActive: {
          background: linear-gradient(
            135deg,
            fade(@color-accent-warning, 35%),
            fade(@color-accent-primary, 35%)
          );
      default: false
    },
    isCurrent: {
          box-shadow: inset 0 0 0 2px fade(@color-accent-primary, 90%);
      default: false
    }
  },

        font-size: @font-size-xs;
        letter-spacing: @letter-spacing-tight;
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
    }
  }
})
</script>

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
  cursor: pointer;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  z-index: 1;

  &:not(.is-active):hover {
    background: rgba(120, 125, 140, 0.35);
  }

  &:active {
    transform: scale(0.97);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 2px rgba(0, 255, 255, 0.6);
  }

  &.is-active {
    background: rgba(0, 255, 255, 0.15);
  }

  &.is-accent {
    background: linear-gradient(
      135deg,
      rgba(255, 180, 0, 0.25),
      rgba(255, 120, 0, 0.65)
    );
  }

  &.is-active.is-accent {
    background: linear-gradient(
      135deg,
      rgba(255, 200, 80, 0.35),
      rgba(0, 255, 255, 0.35)
    );
  }

  &.is-current {
    box-shadow: inset 0 0 0 2px rgba(0, 255, 255, 0.9);
  }
}

.step-tag {
  font-size: 0.7rem;
  letter-spacing: 0.08em;
}
