import { ref } from 'vue'
import { DEFAULT_GRID_SPEC, normalizeGridSpec } from '~/domain/timing'
import type { Pattern, Scene } from '~/types/drums'

const STORAGE_KEY = 'drum-machine/patterns'
const STORAGE_VERSION = 'v2'

interface StoredPatternsV1 {
  version: typeof STORAGE_VERSION
  savedAt: number
  patterns: Pattern[]
}

interface StoredPatternsV2 {
  version: typeof STORAGE_VERSION
  savedAt: number
  patterns: Pattern[]
  scenes: Scene[]
  selectedPatternId: string
  activeSceneId: string | null
}

type StoredPayload = StoredPatternsV1 | StoredPatternsV2

interface StoredState {
  patterns: Pattern[]
  scenes: Scene[]
  selectedPatternId: string
  activeSceneId: string | null
}

const ensurePatternShape = (pattern: Pattern | Partial<Pattern>, index: number): Pattern => {
  return {
    id: pattern?.id ?? `pattern-${index + 1}`,
    name: pattern?.name ?? `Pattern ${index + 1}`,
    gridSpec: normalizeGridSpec(pattern?.gridSpec ?? DEFAULT_GRID_SPEC),
    steps: pattern?.steps ?? {}
  }
}

export function usePatternStorage() {
  const lastSavedAt = ref<number | null>(null)

  const save = (payload: StoredState) => {
    if (!process.client) return
    const normalizedPatterns = payload.patterns.map((pattern, index) => ensurePatternShape(pattern, index))
    const stored: StoredPatternsV2 = {
      version: STORAGE_VERSION,
      savedAt: Date.now(),
      patterns: normalizedPatterns,
      scenes: payload.scenes ?? [],
      selectedPatternId: payload.selectedPatternId,
      activeSceneId: payload.activeSceneId ?? null
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
    lastSavedAt.value = stored.savedAt
  }

  const load = (): StoredState => {
    if (!process.client) {
      return { patterns: [], scenes: [], selectedPatternId: 'pattern-1', activeSceneId: null }
    }
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { patterns: [], scenes: [], selectedPatternId: 'pattern-1', activeSceneId: null }
    }
    try {
      const parsed = JSON.parse(raw) as Partial<StoredPayload>
      const version = parsed.version
      const basePatterns = Array.isArray(parsed.patterns)
        ? parsed.patterns.map((pattern, index) => ensurePatternShape(pattern, index))
        : []
      const baseState: StoredState = {
        patterns: basePatterns,
        scenes: [],
        selectedPatternId: basePatterns[0]?.id ?? 'pattern-1',
        activeSceneId: null
      }
      if (version === 'v2') {
        const parsedV2 = parsed as Partial<StoredPatternsV2>
        if (typeof parsedV2.savedAt === 'number') {
          lastSavedAt.value = parsedV2.savedAt
        }
        return {
          patterns: basePatterns,
          scenes: Array.isArray(parsedV2.scenes) ? parsedV2.scenes : [],
          selectedPatternId: parsedV2.selectedPatternId ?? baseState.selectedPatternId,
          activeSceneId: parsedV2.activeSceneId ?? null
        }
      }
      if (typeof (parsed as Partial<StoredPatternsV1>).savedAt === 'number') {
        lastSavedAt.value = (parsed as Partial<StoredPatternsV1>).savedAt ?? null
      }
      return baseState
    } catch (error) {
      console.error('Failed to parse patterns from LocalStorage', error)
      return { patterns: [], scenes: [], selectedPatternId: 'pattern-1', activeSceneId: null }
    }
  }

  const clear = () => {
    if (!process.client) return
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    save,
    load,
    clear,
    lastSavedAt
  }
}
