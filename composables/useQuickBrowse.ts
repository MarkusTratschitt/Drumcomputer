import { ref } from 'vue'
import type { BrowserMode } from '../types/library'
import type { BrowserFilters } from '../stores/browser'

export interface BrowseHistoryEntry {
  timestamp: number
  mode: BrowserMode
  query: string
  filters: BrowserFilters
  selectedId: string | null
  contextType: 'sample' | 'preset' | 'group' | 'sound'
  contextId: string
}

const maxHistory = 50
const storageKey = 'drumcomputer_quick_browse_v1'

const hasClientStorage = (): boolean => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return false
  if (typeof import.meta !== 'undefined' && 'client' in import.meta && !import.meta.client) return false
  return true
}

const readStorage = (): BrowseHistoryEntry[] => {
  if (!hasClientStorage()) return []
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((entry) => entry && typeof entry.contextId === 'string' && typeof entry.timestamp === 'number')
      .map((entry) => ({
        timestamp: Number(entry.timestamp),
        mode: entry.mode as BrowserMode,
        query: String(entry.query ?? ''),
        filters: (entry.filters ?? {}) as BrowserFilters,
        selectedId: entry.selectedId ?? null,
        contextType: entry.contextType as BrowseHistoryEntry['contextType'],
        contextId: String(entry.contextId)
      }))
  } catch {
    return []
  }
}

const writeStorage = (entries: BrowseHistoryEntry[]) => {
  if (!hasClientStorage()) return
  try {
    localStorage.setItem(storageKey, JSON.stringify(entries))
  } catch {
    // ignore storage errors
  }
}

const sortHistory = (entries: BrowseHistoryEntry[]) => [...entries].sort((a, b) => b.timestamp - a.timestamp)

export function useQuickBrowse() {
  const history = ref<BrowseHistoryEntry[]>(sortHistory(readStorage()))

  function recordBrowse(entry: Omit<BrowseHistoryEntry, 'timestamp'>): void {
    if (!hasClientStorage()) return
    const timestamp = Date.now()
    const withoutContext = history.value.filter((item) => item.contextId !== entry.contextId)
    const next = sortHistory([{ ...entry, timestamp }, ...withoutContext]).slice(0, maxHistory)
    history.value = next
    writeStorage(next)
  }

  function getLastBrowse(contextId: string): BrowseHistoryEntry | null {
    return history.value.find((entry) => entry.contextId === contextId) ?? null
  }

  function restoreBrowse(entry: BrowseHistoryEntry): void {
    void import('../stores/browser').then(async ({ useBrowserStore }) => {
      const browser = useBrowserStore()
      await browser.setMode(entry.mode)
      browser.filters = { ...entry.filters }
      browser.library.query = entry.query
      await browser.search()
      if (entry.selectedId) {
        await browser.selectResult(entry.selectedId)
      }
    })
  }

  function clearHistory(): void {
    history.value = []
    writeStorage([])
  }

  return { history, recordBrowse, getLastBrowse, restoreBrowse, clearHistory }
}
