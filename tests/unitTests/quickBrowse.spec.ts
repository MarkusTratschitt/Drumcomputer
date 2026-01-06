import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useQuickBrowse } from '../../composables/useQuickBrowse'
import {
  __setLibraryRepositoryForTests,
  type LibraryRepository,
  type LibraryItem
} from '../../services/libraryRepository'
import { useBrowserStore } from '../../stores/browser'

class MemoryLibraryRepo implements LibraryRepository {
  constructor(public items: LibraryItem[] = []) {}
  favorites = new Set<string>()
  async search(query: string): Promise<LibraryItem[]>
  async search(query: string, _filters?: unknown): Promise<LibraryItem[]> {
    const text = query.trim().toLowerCase()
    if (!text) return this.items
    return this.items.filter((item) => item.name.toLowerCase().includes(text))
  }
  async getItem(id: string) {
    return this.items.find((item) => item.id === id)
  }
  async getTags(itemId: string) {
    return (await this.getItem(itemId))?.tags ?? []
  }
  async addTag(itemId: string, tag: string) {
    this.items = this.items.map((item) =>
      item.id === itemId ? { ...item, tags: [...item.tags, tag] } : item
    )
    return this.getTags(itemId)
  }
  async removeTag(itemId: string, tag: string) {
    this.items = this.items.map((item) =>
      item.id === itemId ? { ...item, tags: item.tags.filter((value) => value !== tag) } : item
    )
    return this.getTags(itemId)
  }
  async importFile(path: string, meta?: Partial<LibraryItem>) {
    const item: LibraryItem = {
      id: meta?.id ?? path,
      name: meta?.name ?? path,
      tags: meta?.tags ?? [],
      path,
      ...meta
    }
    this.items.push(item)
    return item
  }
  async addToFavorites(itemId: string) {
    this.favorites.add(itemId)
  }
  async removeFromFavorites(itemId: string) {
    this.favorites.delete(itemId)
  }
  async getFavorites() {
    return this.items.filter((item) => this.favorites.has(item.id))
  }
  async isFavorite(itemId: string) {
    return this.favorites.has(itemId)
  }
  async refreshIndex() {
    return
  }
  async importDirectory() {
    return
  }
}

describe('useQuickBrowse', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    if (typeof localStorage !== 'undefined') {
      localStorage.clear()
    }
  })

  it('records history entries grouped by context', () => {
    const quickBrowse = useQuickBrowse()
    vi.spyOn(Date, 'now').mockReturnValueOnce(1000).mockReturnValueOnce(2000)

    quickBrowse.recordBrowse({
      mode: 'LIBRARY',
      query: 'Kick',
      filters: { fileType: 'sample' },
      selectedId: '1',
      contextType: 'sample',
      contextId: 'pad-0'
    })
    quickBrowse.recordBrowse({
      mode: 'LIBRARY',
      query: 'Snare',
      filters: { fileType: 'sample' },
      selectedId: '2',
      contextType: 'sample',
      contextId: 'pad-0'
    })

    expect(quickBrowse.history.value).toHaveLength(1)
    expect(quickBrowse.history.value[0]?.query).toBe('Snare')
  })

  it('returns the last browse entry for a context', () => {
    const quickBrowse = useQuickBrowse()
    quickBrowse.recordBrowse({
      mode: 'LIBRARY',
      query: 'Pad',
      filters: { fileType: 'preset' },
      selectedId: '3',
      contextType: 'preset',
      contextId: 'sound-1'
    })
    const entry = quickBrowse.getLastBrowse('sound-1')
    expect(entry?.query).toBe('Pad')
  })

  it('restores browse state from history', async () => {
    const repo = new MemoryLibraryRepo([{ id: '1', name: 'Kick', tags: [] }])
    __setLibraryRepositoryForTests(repo)
    const store = useBrowserStore()

    const quickBrowse = useQuickBrowse()
    quickBrowse.restoreBrowse({
      timestamp: Date.now(),
      mode: 'LIBRARY',
      query: 'Kick',
      filters: { fileType: 'sample' },
      selectedId: '1',
      contextType: 'sample',
      contextId: 'pad-0'
    })

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(store.mode).toBe('LIBRARY')
    expect(store.library.query).toBe('Kick')
    expect(store.filters.fileType).toBe('sample')
    expect(store.library.selectedId).toBe('1')
  })
})
