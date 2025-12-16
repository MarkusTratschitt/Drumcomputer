import { defineStore } from 'pinia'
import type { DrumPadId, Pattern, Scene, StepGrid } from '~/types/drums'
import type { GridSpec } from '~/types/time'
import { DEFAULT_GRID_SPEC, normalizeGridSpec } from '~/domain/timing'

const createDefaultGrid = (): GridSpec => ({ ...DEFAULT_GRID_SPEC })

const createEmptyPattern = (id: string, name: string): Pattern => ({
  id,
  name,
  gridSpec: createDefaultGrid(),
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
    setPatterns(patterns: Pattern[]) {
      this.patterns = patterns.length ? patterns : [createEmptyPattern('pattern-1', 'Pattern 1')]
      if (!this.patterns.find((pattern) => pattern.id === this.selectedPatternId)) {
        this.selectedPatternId = this.patterns[0]?.id ?? 'pattern-1'
      }
    },
    toggleStep(barIndex: number, stepInBar: number, padId: DrumPadId) {
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
      pattern.gridSpec = normalizeGridSpec(gridSpec)
    }
  }
})
