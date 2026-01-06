import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import {
  __setLibraryRepositoryForTests,
  type LibraryRepository,
  type LibraryItem
} from '../../services/libraryRepository'
import {
  __setFileSystemRepositoryForTests,
  type FileSystemRepository,
  type DirectoryListing
} from '../../services/fileSystemRepository'
import { useBrowserStore, type SortMode } from '../../stores/browser'

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

class MemoryFileRepo implements FileSystemRepository {
  constructor(private listing: DirectoryListing) {}
  async listDir(_path: string): Promise<DirectoryListing> {
    return this.listing
  }
  async stat(_path: string) {
    return { isDir: false }
  }
  async readFileMeta(path: string): Promise<{ name: string; extension?: string }> {
    const name = path.split('/').pop() ?? path
    const ext = name.includes('.') ? name.split('.').pop() : undefined
    const meta: { name: string; extension?: string } = { name }
    if (ext) meta.extension = ext
    return meta
  }
}

const createStoreWithSortMode = async (mode: SortMode) => {
  const store = useBrowserStore()
  await store.search()
  store.setSortMode(mode)
  return store
}

describe('browser sorting', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    if (typeof localStorage !== 'undefined') {
      localStorage.clear()
    }
    const repo = new MemoryLibraryRepo([
      { id: '1', name: 'Alpha', tags: [], importedAt: 2000 },
      { id: '2', name: 'beta', tags: [], importedAt: 1000 },
      { id: '3', name: 'Gamma', tags: [], importedAt: 3000 }
    ])
    __setLibraryRepositoryForTests(repo)
    __setFileSystemRepositoryForTests(
      new MemoryFileRepo({
        dirs: [
          { name: 'b-dir', path: '/b-dir' },
          { name: 'a-dir', path: '/a-dir' }
        ],
        files: [
          { name: 'z.wav', path: '/z.wav' },
          { name: 'a.wav', path: '/a.wav' }
        ]
      })
    )
  })

  it('sorts library results by name asc/desc', async () => {
    const store = await createStoreWithSortMode('name-asc')
    expect(store.library.results.map((item) => item.title)).toEqual(['Alpha', 'beta', 'Gamma'])

    store.setSortMode('name-desc')
    expect(store.library.results.map((item) => item.title)).toEqual(['Gamma', 'beta', 'Alpha'])
  })

  it('sorts library results by date asc/desc', async () => {
    const store = await createStoreWithSortMode('date-asc')
    expect(store.library.results.map((item) => item.id)).toEqual(['2', '1', '3'])

    store.setSortMode('date-desc')
    expect(store.library.results.map((item) => item.id)).toEqual(['3', '1', '2'])
  })

  it('restores relevance order when switching back', async () => {
    const store = await createStoreWithSortMode('name-desc')
    store.setSortMode('relevance')
    expect(store.library.results.map((item) => item.id)).toEqual(['1', '2', '3'])
  })

  it('sorts files when mode changes', async () => {
    const store = useBrowserStore()
    await store.setMode('FILES')
    store.setSortMode('name-asc')
    expect(store.files.entries.dirs.map((dir) => dir.name)).toEqual(['a-dir', 'b-dir'])
    expect(store.files.entries.files.map((file) => file.name)).toEqual(['a.wav', 'z.wav'])
  })

  it('persists sort mode in localStorage', async () => {
    const store = useBrowserStore()
    store.setSortMode('name-desc')
    setActivePinia(createPinia())
    const nextStore = useBrowserStore()
    expect(nextStore.sortMode).toBe('name-desc')
  })
})
