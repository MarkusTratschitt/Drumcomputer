import { defineStore } from 'pinia'
import type { DrumPadId, Pattern, Scene, StepGrid } from '@/types/drums'
import type { GridSpec } from '@/types/time'
import { DEFAULT_GRID_SPEC, normalizeGridSpec } from '@/domain/timing'
import { clampVelocity, cycleVelocity, DEFAULT_STEP_VELOCITY } from '@/domain/velocity'

// Manages patterns and scenes with undo/redo history, grid spec updates, and step velocity editing.
const createDefaultGrid = (): GridSpec => ({ ...DEFAULT_GRID_SPEC })

const createEmptyPattern = (id: string, name: string): Pattern => ({
  id,
  name,
  gridSpec: createDefaultGrid(),
  steps: {}
})

const createScene = (id: string, name: string, patternIds: string[] = []): Scene => ({
  id,
  name,
  patternIds
})

const HISTORY_LIMIT = 50

type PatternsSnapshot = {
  patterns: Pattern[]
  scenes: Scene[]
  selectedPatternId: string
  activeSceneId: string | null
}

export const usePatternsStore = defineStore('patterns', {
  state: () => ({
    patterns: [createEmptyPattern('pattern-1', 'Pattern 1')],
    scenes: [] as Scene[],
    selectedPatternId: 'pattern-1',
    activeSceneId: null as string | null,
    scenePosition: 0,
    history: [] as PatternsSnapshot[],
    historyIndex: -1,
    isRestoring: false
  }),
  getters: {
    currentPattern(state): Pattern {
      return state.patterns.find((p) => p.id === state.selectedPatternId) ?? createEmptyPattern('pattern-1', 'Pattern 1')
    },
    currentScene(state): Scene | null {
      return state.scenes.find((scene) => scene.id === state.activeSceneId) ?? null
    }
  },
  actions: {
    snapshotState(): PatternsSnapshot {
      return {
        patterns: JSON.parse(JSON.stringify(this.patterns)) as Pattern[],
        scenes: JSON.parse(JSON.stringify(this.scenes)) as Scene[],
        selectedPatternId: this.selectedPatternId,
        activeSceneId: this.activeSceneId
      }
    },
    recordHistory() {
      if (this.isRestoring) return
      const snapshot = this.snapshotState()
      this.history = this.history.slice(0, this.historyIndex + 1)
      this.history.push(snapshot)
      if (this.history.length > HISTORY_LIMIT) {
        this.history.shift()
        this.historyIndex -= 1
      }
      this.historyIndex = this.history.length - 1
    },
    restoreSnapshot(snapshot: PatternsSnapshot) {
      this.isRestoring = true
      this.patterns = snapshot.patterns.map((pattern) => ({
        ...pattern,
        gridSpec: normalizeGridSpec(pattern.gridSpec)
      }))
      this.setScenes(snapshot.scenes)
      this.selectedPatternId = snapshot.selectedPatternId
      if (!this.patterns.find((pattern) => pattern.id === this.selectedPatternId)) {
        this.selectedPatternId = this.patterns[0]?.id ?? 'pattern-1'
      }
      this.activeSceneId = snapshot.activeSceneId
      this.scenePosition = 0
      this.isRestoring = false
    },
    undo() {
      if (this.historyIndex <= 0) return
      this.historyIndex -= 1
      const snapshot = this.history[this.historyIndex]
      if (snapshot) {
        this.restoreSnapshot(snapshot)
      }
    },
    redo() {
      if (this.historyIndex >= this.history.length - 1) return
      this.historyIndex += 1
      const snapshot = this.history[this.historyIndex]
      if (snapshot) {
        this.restoreSnapshot(snapshot)
      }
    },
    selectPattern(id: string) {
      this.selectedPatternId = id
    },
    addPattern(name?: string) {
      this.recordHistory()
      const nextIndex = this.patterns.length + 1
      const id = `pattern-${Date.now()}-${nextIndex}`
      const pattern = createEmptyPattern(id, name ?? `Pattern ${nextIndex}`)
      this.patterns.push(pattern)
      this.selectedPatternId = pattern.id
    },
    renamePattern(id: string, name: string) {
      this.recordHistory()
      const pattern = this.patterns.find((entry) => entry.id === id)
      if (pattern) {
        pattern.name = name
      }
    },
    setScenes(scenes: Scene[]) {
      const allowedIds = this.patterns.map((pattern) => pattern.id)
      this.scenes = scenes.map((scene) => ({
        ...scene,
        patternIds: scene.patternIds.filter((id) => allowedIds.includes(id))
      }))
      if (this.activeSceneId && !this.scenes.find((scene) => scene.id === this.activeSceneId)) {
        this.activeSceneId = null
        this.scenePosition = 0
      }
    },
    setPatterns(patterns: Pattern[]) {
      this.patterns = patterns.length ? patterns : [createEmptyPattern('pattern-1', 'Pattern 1')]
      if (!this.patterns.find((pattern) => pattern.id === this.selectedPatternId)) {
        this.selectedPatternId = this.patterns[0]?.id ?? 'pattern-1'
      }
      const allowedIds = this.patterns.map((pattern) => pattern.id)
      this.scenes = this.scenes.map((scene) => ({
        ...scene,
        patternIds: scene.patternIds.filter((id) => allowedIds.includes(id))
      }))
      if (this.activeSceneId && !this.scenes.find((scene) => scene.id === this.activeSceneId)) {
        this.activeSceneId = null
        this.scenePosition = 0
      }
    },
    toggleStep(barIndex: number, stepInBar: number, padId: DrumPadId) {
      this.recordHistory()
      const pattern = this.currentPattern
      const grid = pattern.steps as StepGrid
      const bar = grid[barIndex] ?? {}
      const stepRow = bar[stepInBar] ?? {}
      const updated = { ...stepRow }
      const nextVelocity = cycleVelocity(updated[padId]?.velocity?.value)
      if (nextVelocity === null) {
        delete updated[padId]
      } else {
        updated[padId] = { velocity: { value: clampVelocity(nextVelocity) } }
      }
      grid[barIndex] = { ...bar, [stepInBar]: updated }
    },
    setStepVelocity(barIndex: number, stepInBar: number, padId: DrumPadId, velocity: number) {
      this.recordHistory()
      const pattern = this.currentPattern
      const grid = pattern.steps as StepGrid
      const bar = grid[barIndex] ?? {}
      const stepRow = bar[stepInBar] ?? {}
      const updated = { ...stepRow }
      updated[padId] = { velocity: { value: clampVelocity(velocity || DEFAULT_STEP_VELOCITY) } }
      grid[barIndex] = { ...bar, [stepInBar]: updated }
    },
    updateGridSpec(gridSpec: GridSpec) {
      this.recordHistory()
      const pattern = this.currentPattern
      pattern.gridSpec = normalizeGridSpec(gridSpec)
    },
    addScene(name: string, patternIds: string[] = []) {
      this.recordHistory()
      const id = `scene-${Date.now()}-${this.scenes.length + 1}`
      this.scenes.push(createScene(id, name, patternIds))
      this.activeSceneId = id
      this.scenePosition = 0
    },
    updateScene(sceneId: string, updates: Partial<Scene>) {
      this.recordHistory()
      const scene = this.scenes.find((entry) => entry.id === sceneId)
      if (!scene) return
      if (updates.name) {
        scene.name = updates.name
      }
      if (updates.patternIds) {
        const allowed = this.patterns.map((pattern) => pattern.id)
        scene.patternIds = updates.patternIds.filter((id) => allowed.includes(id))
      }
    },
    selectScene(sceneId: string | null) {
      this.activeSceneId = sceneId
      this.scenePosition = 0
    },
    prepareScenePlayback() {
      this.scenePosition = 0
      const scene = this.currentScene
      if (scene && scene.patternIds.length > 0) {
        const nextId = scene.patternIds[0]
        if (nextId) {
          this.selectedPatternId = nextId
        }
        this.scenePosition = scene.patternIds.length > 1 ? 1 : 0
      }
    },
    advanceScenePlayback(): Pattern {
      const scene = this.currentScene
      if (!scene || scene.patternIds.length === 0) {
        return this.currentPattern
      }
      const nextId = scene.patternIds[this.scenePosition % scene.patternIds.length]
      this.scenePosition = (this.scenePosition + 1) % scene.patternIds.length
      if (nextId) {
        this.selectedPatternId = nextId
      }
      return this.currentPattern
    }
  }
})
