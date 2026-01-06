import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import {
  __resetLibraryRepository,
  __setLibraryRepositoryForTests,
  getLibraryRepository,
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

describe('favorites', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    __resetLibraryRepository()
    if (typeof localStorage !== 'undefined') {
      localStorage.clear()
    }
  })

  afterEach(() => {
    __resetLibraryRepository()
  })

  it('adds/removes favorites and persists them', async () => {
    const repo = getLibraryRepository()
    await repo.importFile('/kick.wav', { id: 'kick', name: 'Kick', tags: [] })
    await repo.addToFavorites('kick')
    expect(await repo.isFavorite('kick')).toBe(true)
    const favorites = await repo.getFavorites()
    expect(favorites.map((item) => item.id)).toContain('kick')

    __resetLibraryRepository()
    const reloaded = getLibraryRepository()
    expect(await reloaded.isFavorite('kick')).toBe(true)

    await reloaded.removeFromFavorites('kick')
    expect(await reloaded.isFavorite('kick')).toBe(false)
  })

  it('toggles favorites through the browser store action', async () => {
    const repo = new MemoryLibraryRepo([
      { id: '1', name: 'Kick', tags: [] },
      { id: '2', name: 'Snare', tags: [] }
    ])
    __setLibraryRepositoryForTests(repo)
    const store = useBrowserStore()
    await store.search()

    await store.toggleFavorite('1')
    expect(await repo.isFavorite('1')).toBe(true)
    expect(store.library.results.find((item) => item.id === '1')?.favorites).toBe(true)
  })

  it('filters results to favorites and marks display subtitles', async () => {
    const repo = new MemoryLibraryRepo([
      { id: '1', name: 'Kick', tags: ['drum'] },
      { id: '2', name: 'Snare', tags: ['drum'] }
    ])
    await repo.addToFavorites('2')
    __setLibraryRepositoryForTests(repo)

    const store = useBrowserStore()
    store.setFilter('favorites', true)
    await store.search()

    expect(store.library.results).toHaveLength(1)
    expect(store.library.results[0]?.id).toBe('2')
    const display = store.toDisplayModels()
    const subtitle = display.rightModel.items?.[0]?.subtitle ?? ''
    expect(subtitle.includes('★')).toBe(true)
  })
})
