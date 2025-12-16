import { ref } from 'vue'
import { DEFAULT_GRID_SPEC, normalizeGridSpec } from '~/domain/timing'
import type { Pattern } from '~/types/drums'

const STORAGE_KEY = 'drum-machine/patterns'
const STORAGE_VERSION = 'v1'

interface StoredPatternsV1 {
  version: typeof STORAGE_VERSION
  savedAt: number
  patterns: Pattern[]
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

  const save = (patterns: Pattern[]) => {
    if (!process.client) return
    const payload: StoredPatternsV1 = {
      version: STORAGE_VERSION,
      savedAt: Date.now(),
      patterns: patterns.map((pattern, index) => ensurePatternShape(pattern, index))
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    lastSavedAt.value = payload.savedAt
  }

  const load = (): Pattern[] => {
    if (!process.client) return []
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    try {
      const parsed = JSON.parse(raw) as Partial<StoredPatternsV1>
      if (parsed.version !== STORAGE_VERSION || !Array.isArray(parsed.patterns)) {
        return []
      }
      if (typeof parsed.savedAt === 'number') {
        lastSavedAt.value = parsed.savedAt
      }
      return parsed.patterns.map((pattern, index) => ensurePatternShape(pattern, index))
    } catch (error) {
      console.error('Failed to parse patterns from LocalStorage', error)
      return []
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
