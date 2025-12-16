import { computed, ref } from 'vue'
import type { Pattern, StepGrid } from '~/types/drums'
import { secondsPerStep } from '~/domain/timing'
import type { GridSpec } from '~/types/time'

export interface SequencerState {
  currentStep: number
  isPlaying: boolean
}

export function useSequencer(pattern: Pattern) {
  const state = ref<SequencerState>({ currentStep: 0, isPlaying: false })
  const listeners = ref<Array<(stepIndex: number) => void>>([])

  const totalSteps = computed(() => pattern.gridSpec.bars * pattern.gridSpec.division)

  const toggleCell = (grid: StepGrid, barIndex: number, stepInBar: number, padId: string) => {
    const bar = grid[barIndex] ?? {}
    const stepRow = bar[stepInBar] ?? {}
    const updated = { ...stepRow }
    if (updated[padId]) {
      delete updated[padId]
    } else {
      updated[padId] = { velocity: { value: 1 } }
    }
    grid[barIndex] = { ...bar, [stepInBar]: updated }
  }

  const advance = (bpm: number, gridSpec: GridSpec) => {
    const stepDuration = secondsPerStep(bpm, gridSpec.division)
    state.value.currentStep = (state.value.currentStep + 1) % totalSteps.value
    listeners.value.forEach((fn) => fn(state.value.currentStep))
    return stepDuration
  }

  const onStep = (cb: (stepIndex: number) => void) => {
    listeners.value.push(cb)
  }

  const setPlaying = (playing: boolean) => {
    state.value.isPlaying = playing
  }

  return {
    state,
    totalSteps,
    toggleCell,
    advance,
    onStep,
    setPlaying
  }
}
