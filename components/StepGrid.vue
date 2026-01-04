<template lang="pug">
  client-only(tag="div")
    .step-grid-shell(
      role="grid"
      :aria-label="stepGridLabel"
      :aria-colcount="totalSteps"
      tabindex="0"
      @keydown="onKeydown"
      ref="shell"
    )
      .step-row(role="row")
        StepCell(
          v-for="stepIndex in totalSteps"
          :key="stepIndex"
          :display-label="String(stepIndex)"
          :is-active="isActive(stepIndex - 1)"
          :is-accent="isAccent(stepIndex - 1)"
          :is-current="isCurrent(stepIndex - 1)"
          :class="{ 'is-pattern-start': isPatternStart(stepIndex - 1) }"
          role="gridcell"
          :aria-label="cellAriaLabel(stepIndex - 1)"
          :aria-selected="isActive(stepIndex - 1)"
          @cell:toggle="emitToggle(stepIndex - 1)"
          @cell:pointerdown="onCellPointerDown(stepIndex - 1, $event)"
          @cell:pointermove="onCellPointerMove($event)"
          @cell:pointerup="onCellPointerUp($event)"
          @cell:pointercancel="onCellPointerCancel($event)"
        )
        div.pattern-boundary(
          v-for="boundary in patternBoundaries"
          :key="boundary"
          :style="boundaryStyle(boundary)"
        )
      PlayheadOverlay(
        v-if="totalSteps > 0"
        :current-step="currentStepNormalized"
        :total-steps="totalSteps"
        :is-playing="isPlaying"
      )
      div.loop-overlay(:style="loopStyle" aria-hidden="true")
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import StepCell from './StepCell.vue'
import PlayheadOverlay from './PlayheadOverlay.vue'
import type { GridSpec } from '@/types/time'
import type { DrumPadId, StepGrid } from '@/types/drums'
import { ACCENT_STEP_VELOCITY, clampVelocity } from '@/domain/velocity'

export default defineComponent({
  name: 'StepGrid',
  components: {
    StepCell,
    PlayheadOverlay
  },
  props: {
    gridSpec: { type: Object as () => GridSpec, required: true },
    steps: { type: Object as () => StepGrid, required: true },
    patternChain: {
      type: Array as () => Array<{ id: string; bars: number }> | null,
      default: null
    },
    selectedPad: { type: String as () => DrumPadId | null, default: null },
    currentStep: { type: Number, required: true },
    isPlaying: { type: Boolean, required: true },
    followEnabled: { type: Boolean, default: true },
    loopStart: { type: Number, default: 0 },
    loopEnd: { type: Number, default: 1 }
  },
  emits: ['step:toggle', 'playhead:scrub', 'step:velocity'],
  data() {
    return {
      dragState: null as null | {
        pointerId: number
        startY: number
        startVelocity: number
        stepIndex: number
      }
    }
  },
  computed: {
    totalSteps(): number {
      return Math.max(0, this.gridSpec.bars * this.gridSpec.division)
    },
    currentStepNormalized(): number {
      const steps = Math.max(this.totalSteps, 1)
      return ((this.currentStep % steps) + steps) % steps
    },
    stepGridLabel(): string {
      return this.selectedPad ? `Steps for ${this.selectedPad}` : 'Step grid'
    },
    patternBoundaries(): number[] {
      if (!this.patternChain || this.patternChain.length === 0) {
        return []
      }

      const boundaries: number[] = []
      const stepsPerBar = this.gridSpec.division
      let cumulative = 0

      this.patternChain.forEach((entry, index) => {
        cumulative += entry.bars * stepsPerBar
        if (index === this.patternChain!.length - 1) {
          return
        }
        if (cumulative < this.totalSteps) {
          boundaries.push(cumulative)
        }
      })

      return boundaries
    },
    loopStyle(): Record<string, string> {
      const total = Math.max(1, this.totalSteps)
      const clampedStart = Math.max(0, Math.min(this.loopStart, total - 1))
      const clampedEnd = Math.max(clampedStart + 1, Math.min(this.loopEnd, total))
      const left = (clampedStart / total) * 100
      const width = ((clampedEnd - clampedStart) / total) * 100
      return { left: `${left}%`, width: `${width}%` }
    }
  },
  methods: {
    focusGrid(): void {
      const el = this.$refs.shell as HTMLElement | undefined
      el?.focus()
    },
    resolveStepPosition(index: number): { barIndex: number; stepInBar: number } {
      const barIndex = Math.floor(index / this.gridSpec.division)
      const stepInBar = index % this.gridSpec.division
      return { barIndex, stepInBar }
    },
    emitToggle(index: number): void {
      if (!this.selectedPad) {
        return
      }
      const { barIndex, stepInBar } = this.resolveStepPosition(index)
      this.$emit('step:toggle', {
        barIndex,
        stepInBar,
        padId: this.selectedPad
      })
    },
    velocityAt(index: number): number | null {
      if (!this.selectedPad) {
        return null
      }

      const { barIndex, stepInBar } = this.resolveStepPosition(index)

      return (
        this.steps[barIndex]?.[stepInBar]?.[this.selectedPad]?.velocity?.value ??
        null
      )
    },
    isActive(index: number): boolean {
      return this.velocityAt(index) !== null
    },
    isAccent(index: number): boolean {
      const velocity = this.velocityAt(index)
      const ACCENT_EPSILON = 0.01

      return (
        velocity !== null &&
        velocity >= ACCENT_STEP_VELOCITY - ACCENT_EPSILON
      )
    },
    isCurrent(index: number): boolean {
      return this.followEnabled && index === this.currentStepNormalized
    },
    onKeydown(event: KeyboardEvent): void {
      if (this.totalSteps <= 0) {
        return
      }

      const isArrowLeft = event.key === 'ArrowLeft'
      const isArrowRight = event.key === 'ArrowRight'

      if (!isArrowLeft && !isArrowRight) {
        return
      }

      event.preventDefault()

      const stepDelta = event.shiftKey ? this.gridSpec.division : 1
      const delta = isArrowLeft ? -stepDelta : stepDelta
      const steps = this.totalSteps
      const nextStep =
        ((this.currentStepNormalized + delta) % steps + steps) % steps

      this.$emit('playhead:scrub', { stepIndex: nextStep })
    },
    emitVelocity(index: number, velocity: number): void {
      if (!this.selectedPad) {
        return
      }
      const { barIndex, stepInBar } = this.resolveStepPosition(index)
      this.$emit('step:velocity', {
        barIndex,
        stepInBar,
        padId: this.selectedPad,
        velocity
      })
    },
    onCellPointerDown(index: number, event: PointerEvent): void {
      if (!this.selectedPad) {
        return
      }
      const startVelocity = this.velocityAt(index)
      if (startVelocity === null) {
        return
      }

      this.dragState = {
        pointerId: event.pointerId,
        startY: event.clientY,
        startVelocity,
        stepIndex: index
      }
    },
    onCellPointerMove(event: PointerEvent): void {
      if (!this.dragState || event.pointerId !== this.dragState.pointerId) {
        return
      }
      const deltaY = this.dragState.startY - event.clientY
      const VELOCITY_PER_PIXEL = 0.006
      const nextVelocity = clampVelocity(
        this.dragState.startVelocity + deltaY * VELOCITY_PER_PIXEL
      )
      this.emitVelocity(this.dragState.stepIndex, nextVelocity)
    },
    onCellPointerUp(event: PointerEvent): void {
      if (this.dragState && event.pointerId === this.dragState.pointerId) {
        this.dragState = null
      }
    },
    onCellPointerCancel(event: PointerEvent): void {
      if (this.dragState && event.pointerId === this.dragState.pointerId) {
        this.dragState = null
      }
    },
    cellAriaLabel(index: number): string {
      const { barIndex, stepInBar } = this.resolveStepPosition(index)
      const stepNumber = stepInBar + 1
      const barNumber = barIndex + 1
      const activeState = this.isActive(index) ? 'active' : 'inactive'
      return `Bar ${barNumber}, step ${stepNumber}, ${activeState}`
    },
    isPatternStart(index: number): boolean {
      if (!this.patternChain || this.patternChain.length === 0) {
        return false
      }
      if (index === 0) {
        return true
      }
      return this.patternBoundaries.includes(index)
    },
    boundaryStyle(startIndex: number): Record<string, string> {
      const leftPercent =
        this.totalSteps > 0 ? (startIndex / this.totalSteps) * 100 : 0
      return {
        left: `${leftPercent}%`
      }
    }
  }
})
</script>

<style scoped lang="less">
@import '@/styles/variables.less';

.step-grid-shell {
  margin-top: 0;
  padding: 10px;
  background: @color-surface-2;
  border: 1px solid @color-border-2;
  border-radius: @radius-l;
  position: relative;
  height: 100%;
  max-height: 96px;
  overflow: visible;
}

.step-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(32px, 1fr));
  gap: 8px;
  position: relative;
  overflow: visible;

  > .playhead-overlay {
    pointer-events: none;
    z-index: 0;
  }

  > .step-cell {
    z-index: 1;
  }

  > .step-cell:nth-child(4n + 1) {
    border-left: 2px solid rgba(255, 255, 255, 0.12);
    padding-left: 12px;
  }

  > .step-cell.is-pattern-start {
    box-shadow:
      inset 0 0 0 2px fade(@color-accent-primary, 45%),
      0 0 10px fade(@color-accent-primary, 16%);
  }
}

.pattern-boundary {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  margin-left: -1px;
  background: linear-gradient(
    to bottom,
    fade(@color-accent-primary, 0%) 0%,
    fade(@color-accent-primary, 28%) 45%,
    fade(@color-accent-primary, 8%) 100%
  );
  pointer-events: none;
  z-index: 0;
}

.loop-overlay {
  position: absolute;
  top: 0;
  bottom: 0;
  background: fade(@color-accent-primary, 12%);
  border-left: 2px solid fade(@color-accent-primary, 35%);
  border-right: 2px solid fade(@color-accent-primary, 35%);
  pointer-events: none;
  z-index: 0;
}

@media (max-height: 820px) {
  .step-grid-shell {
    max-height: 88px;
    padding: 8px;
  }
}

@media (max-width: 640px) {
  .step-grid-shell {
    padding: 8px;
  }

  .step-row {
    gap: 6px;
    grid-template-columns: repeat(auto-fit, minmax(44px, 1fr));
  }

  .step-row > .step-cell {
    min-height: 44px;
    padding: 10px 0;
    font-size: @font-size-xs;
  }
}

@media (max-width: 480px) {
  .step-grid-shell {
    padding: 6px;
    max-height: 80px;
  }

  .step-row {
    gap: 6px;
    grid-template-columns: repeat(auto-fit, minmax(48px, 1fr));
  }

  .step-row > .step-cell {
    min-height: 48px;
    padding: 12px 0;
  }
}
</style>
