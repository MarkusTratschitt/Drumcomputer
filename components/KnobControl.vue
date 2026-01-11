<template>
  <div
    class="knob"
    role="presentation"
    tabindex="0"
    :aria-label="ariaLabel"
    :title="titleText"
    :style="knobStyle"
    @wheel.prevent="onWheel"
    @pointerdown.prevent="onPointerDown"
    @keydown="onKeydown"
    @focus="onFocus"
    @blur="onBlur"
  ></div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value))

export default defineComponent({
  name: 'KnobControl',
  props: {
    index: { type: Number, required: true },
    label: { type: String, default: '' },
    value: { type: Number, default: 0 },
    min: { type: Number, default: 0 },
    max: { type: Number, default: 127 },
    step: { type: Number, default: 1 },
    fineStep: { type: Number, default: undefined },
    shiftHeld: { type: Boolean, default: false },
    tooltip: { type: String, default: '' }
  },
  emits: ['turn', 'focus', 'blur'],
  data() {
    return {
      dragActive: false,
      lastClientY: 0,
      dragAccumulator: 0,
      pointerId: null as number | null
    }
  },
  computed: {
    progress(): number {
      const range = this.max - this.min
      if (range === 0) return 0
      return clamp((this.value - this.min) / range, 0, 1)
    },
    knobAngle(): number {
      // Map value range to -135..135 deg for indicator travel.
      return -135 + this.progress * 270
    },
    knobStyle(): Record<string, string> {
      return { '--knob-angle': `${this.knobAngle}deg` }
    },
    ariaLabel(): string {
      return this.label ? `${this.label}` : `Encoder ${this.index + 1}`
    },
    titleText(): string {
      return this.tooltip || this.label || this.ariaLabel
    }
  },
  beforeUnmount() {
    window.removeEventListener('pointermove', this.onPointerMove)
    window.removeEventListener('pointerup', this.onPointerUp)
  },
  methods: {
    emitTurn(delta: number, fine?: boolean) {
      if (!delta) return
      this.$emit('turn', { delta, fine: !!fine })
    },
    isFine(event?: WheelEvent | PointerEvent | KeyboardEvent): boolean {
      return this.shiftHeld || Boolean(event?.shiftKey)
    },
    onWheel(event: WheelEvent) {
      const direction = event.deltaY < 0 ? 1 : -1
      const magnitude = Math.abs(event.deltaY)
      const steps = magnitude > 60 ? 2 : 1
      this.emitTurn(direction * steps, this.isFine(event))
    },
    onKeydown(event: KeyboardEvent) {
      let handled = false
      if (event.key === 'ArrowUp' || event.key === 'ArrowRight') {
        this.emitTurn(1, this.isFine(event))
        event.preventDefault()
        handled = true
      } else if (event.key === 'ArrowDown' || event.key === 'ArrowLeft') {
        this.emitTurn(-1, this.isFine(event))
        event.preventDefault()
        handled = true
      }
      if (handled) {
        event.stopPropagation()
      }
    },
    onPointerDown(event: PointerEvent) {
      this.dragActive = true
      this.lastClientY = event.clientY
      this.dragAccumulator = 0
      this.pointerId = event.pointerId
      const target = event.currentTarget as HTMLElement | null
      target?.setPointerCapture?.(event.pointerId)
      target?.focus?.()
      this.$emit('focus')
      window.addEventListener('pointermove', this.onPointerMove)
      window.addEventListener('pointerup', this.onPointerUp)
    },
    onPointerMove(event: PointerEvent) {
      if (!this.dragActive) return
      if (this.pointerId !== null && event.pointerId !== this.pointerId) return
      const deltaY = this.lastClientY - event.clientY
      this.dragAccumulator += deltaY
      const stepPx = 6
      const steps = Math.trunc(this.dragAccumulator / stepPx)
      if (steps !== 0) {
        this.dragAccumulator -= steps * stepPx
        this.emitTurn(steps, this.isFine(event))
      }
      this.lastClientY = event.clientY
    },
    onPointerUp(event: PointerEvent) {
      if (this.pointerId !== null && event.pointerId !== this.pointerId) return
      this.dragActive = false
      this.pointerId = null
      this.dragAccumulator = 0
      window.removeEventListener('pointermove', this.onPointerMove)
      window.removeEventListener('pointerup', this.onPointerUp)
    },
    onFocus() {
      this.$emit('focus')
    },
    onBlur() {
      this.$emit('blur')
    }
  }
})
</script>
