import { defineStore } from 'pinia'
import type { Pattern, Scene, StepGrid } from '~/types/drums'
import type { GridSpec } from '~/types/time'

const defaultGrid: GridSpec = { bars: 1, division: 16 }

const createEmptyPattern = (id: string, name: string): Pattern => ({
  id,
  name,
  gridSpec: defaultGrid,
  steps: {}
})

export const usePatternsStore = defineStore('patterns', {
  state: () => ({
    patterns: [createEmptyPattern('pattern-1', 'Pattern 1')],
    scenes: [] as Scene[],
    selectedPatternId: 'pattern-1'
  }),
  getters: {
    currentPattern(state): Pattern {
      return state.patterns.find((p) => p.id === state.selectedPatternId) ?? createEmptyPattern('pattern-1', 'Pattern 1')
    }
  },
  actions: {
    selectPattern(id: string) {
      this.selectedPatternId = id
    },
    toggleStep(barIndex: number, stepInBar: number, padId: string) {
      const pattern = this.currentPattern
      const grid = pattern.steps as StepGrid
      const bar = grid[barIndex] ?? {}
      const stepRow = bar[stepInBar] ?? {}
      const updated = { ...stepRow }
      if (updated[padId]) {
        delete updated[padId]
      } else {
        updated[padId] = { velocity: { value: 1 } }
      }
      grid[barIndex] = { ...bar, [stepInBar]: updated }
    },
    updateGridSpec(gridSpec: GridSpec) {
      const pattern = this.currentPattern
      pattern.gridSpec = gridSpec
    }
  }
})
