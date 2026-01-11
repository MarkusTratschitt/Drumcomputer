<template>
  <div
    class="encoder"
    role="button"
    tabindex="0"
    :aria-label="encoderTooltip"
    :title="encoderTooltip"
    @pointerdown.prevent="onPointerDown"
    @keydown="onKeydown"
  >
    <div class="encoder-cap">⏺</div>
    <div class="encoder-arrows">↕ ↔</div>
    <div class="encoder-label">Push to confirm</div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { useControlStore } from '@/stores/control'
import { useShortcuts } from '@/composables/useShortcuts'

const VERTICAL_STEP_PX = 6
const HORIZONTAL_THRESHOLD_PX = 12

export default defineComponent({
  name: 'FourDEncoder',
  data() {
    return {
      dragActive: false,
      lastX: 0,
      lastY: 0,
      accumX: 0,
      accumY: 0,
      pointerId: null as number | null,
      shortcuts: useShortcuts()
    }
  },
  computed: {
    control() {
      return useControlStore()
    },
    encoderTooltip(): string {
      const turnUp = this.shortcuts.title('ENC4D_TURN_INC', 'Turn +')
      const turnDown = this.shortcuts.title('ENC4D_TURN_DEC', 'Turn -')
      const tilt = this.shortcuts.title('ENC4D_TILT_LEFT', 'Tilt')
      const press = this.shortcuts.title('ENC4D_PRESS', 'Press')
      return `${turnUp} • ${turnDown} • ${tilt} • ${press}`
    }
  },
  beforeUnmount() {
    window.removeEventListener('pointermove', this.onPointerMove)
    window.removeEventListener('pointerup', this.onPointerUp)
  },
  methods: {
    onPointerDown(event: PointerEvent) {
      this.dragActive = true
      this.lastX = event.clientX
      this.lastY = event.clientY
      this.accumX = 0
      this.accumY = 0
      this.pointerId = event.pointerId
      const target = event.currentTarget as HTMLElement | null
      target?.setPointerCapture?.(event.pointerId)
      window.addEventListener('pointermove', this.onPointerMove)
      window.addEventListener('pointerup', this.onPointerUp)
    },
    onPointerMove(event: PointerEvent) {
      if (!this.dragActive) return
      if (this.pointerId !== null && event.pointerId !== this.pointerId) return
      const deltaX = event.clientX - this.lastX
      const deltaY = this.lastY - event.clientY
      this.accumX += deltaX
      this.accumY += deltaY

      // Horizontal tilt
      if (Math.abs(this.accumX) >= HORIZONTAL_THRESHOLD_PX) {
        const direction = this.accumX > 0 ? 'right' : 'left'
        this.control.tiltEncoder4D(direction)
        this.accumX = 0
      }

      // Vertical turn (convert pixels to steps)
      const steps = Math.trunc(this.accumY / VERTICAL_STEP_PX)
      if (steps !== 0) {
        this.accumY -= steps * VERTICAL_STEP_PX
        this.control.turnEncoder4D(steps)
      }

      this.lastX = event.clientX
      this.lastY = event.clientY
    },
    onPointerUp(event: PointerEvent) {
      if (this.pointerId !== null && event.pointerId !== this.pointerId) return
      const isClick = Math.abs(this.accumX) < HORIZONTAL_THRESHOLD_PX && Math.abs(this.accumY) < VERTICAL_STEP_PX
      if (isClick) {
        void this.control.pressEncoder4D()
      }
      this.dragActive = false
      this.pointerId = null
      this.accumX = 0
      this.accumY = 0
      window.removeEventListener('pointermove', this.onPointerMove)
      window.removeEventListener('pointerup', this.onPointerUp)
    },
    onKeydown(event: KeyboardEvent) {
      let handled = false
      if (event.key === 'ArrowUp') {
        this.control.turnEncoder4D(1)
        event.preventDefault()
        handled = true
      } else if (event.key === 'ArrowDown') {
        this.control.turnEncoder4D(-1)
        event.preventDefault()
        handled = true
      } else if (event.key === 'ArrowLeft') {
        this.control.tiltEncoder4D('left')
        event.preventDefault()
        handled = true
      } else if (event.key === 'ArrowRight') {
        this.control.tiltEncoder4D('right')
        event.preventDefault()
        handled = true
      } else if (event.key === 'Enter' || event.key === ' ') {
        void this.control.pressEncoder4D()
        event.preventDefault()
        handled = true
      }
      if (handled) {
        event.stopPropagation()
      }
    }
  }
})
</script>

<style scoped lang="less">
@import '@/styles/variables.less';

.encoder {
  align-self: stretch;
  min-width: 120px;
  padding: @space-s @space-m;
  border-radius: @radius-m;
  background: linear-gradient(180deg, #181c26, #0f121a);
  border: 1px solid #2d3542;
  color: @color-text-primary;
  display: grid;
  place-items: center;
  gap: @space-xs;
  text-align: center;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,0.04),
    0 4px 12px rgba(0,0,0,0.4);
}

.encoder:focus-visible {
  outline: 2px solid #f68b1e;
  outline-offset: 2px;
}

.encoder-cap {
  font-size: 24px;
  color: #f68b1e;
}

.encoder-arrows {
  letter-spacing: 0.25em;
}

.encoder-label {
  font-size: @font-size-xs;
  opacity: 0.85;
}
</style>
