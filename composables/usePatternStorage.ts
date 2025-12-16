import { ref } from 'vue'
import type { Pattern } from '~/types/drums'

const STORAGE_KEY = 'drum-machine/patterns'

export function usePatternStorage() {
  const lastSavedAt = ref<number | null>(null)

  const save = (patterns: Pattern[]) => {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patterns))
    lastSavedAt.value = Date.now()
  }

  const load = (): Pattern[] => {
    if (typeof window === 'undefined') return []
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    try {
      return JSON.parse(raw) as Pattern[]
    } catch (error) {
      console.error('Failed to parse patterns from LocalStorage', error)
      return []
    }
  }

  const clear = () => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    save,
    load,
    clear,
    lastSavedAt
  }
}
