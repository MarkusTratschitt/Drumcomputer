import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBrowserStore } from '../../stores/browser'
import {
  __setLibraryRepositoryForTests,
  type LibraryRepository,
  type LibraryItem
} from '../../services/libraryRepository'

class MemoryLibraryRepo implements LibraryRepository {
  constructor(public items: LibraryItem[] = []) { }
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
  async getCategories() {
    return []
  }
  async getProducts() {
    return []
  }
  async getBanks() {
    return []
  }
  async getSubBanks() {
    return []
  }
  async refreshIndex() {
    return
  }
  async importDirectory() {
    return
  }
}

describe('browser performance helpers', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    if (typeof localStorage !== 'undefined') {
      localStorage.clear()
    }
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
  })

  it('debounces search calls on query changes', async () => {
    const repo = new MemoryLibraryRepo([{ id: '1', name: 'Kick', tags: [] }])
    __setLibraryRepositoryForTests(repo)
    const store = useBrowserStore()
    await store.setQuery('Kick')
    expect(store.library.results.length).toBe(0)
    vi.advanceTimersByTime(310)
    await Promise.resolve()
    await Promise.resolve()
    expect(store.library.results.length).toBeGreaterThan(0)
  })

  it('limits display items to 100 when results are large', async () => {
    const items: LibraryItem[] = Array.from({ length: 150 }, (_, index) => ({
      id: String(index),
      name: `Item ${index}`,
      tags: []
    }))
    __setLibraryRepositoryForTests(new MemoryLibraryRepo(items))
    const store = useBrowserStore()
    await store.search()
    const models = store.toDisplayModels()
    expect(models.rightModel.items?.length).toBe(100)
  })
})
