import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBrowserStore } from '@/stores/browser'
import {
  __setLibraryRepositoryForTests,
  type LibraryRepository,
  type LibraryItem
} from '@/services/libraryRepository'
import {
  __setFileSystemRepositoryForTests,
  type FileSystemRepository,
  type DirectoryListing
} from '@/services/fileSystemRepository'

class MemoryLibraryRepo implements LibraryRepository {
  constructor(public items: LibraryItem[] = []) {}

  async search(query: string): Promise<LibraryItem[]>
  async search(query: string, _filters?: unknown): Promise<LibraryItem[]> {
    const term = query.trim().toLowerCase()
    if (!term) return [...this.items]
    return this.items.filter((item) => item.name.toLowerCase().includes(term))
  }

  async getItem(id: string): Promise<LibraryItem | undefined> {
    return this.items.find((item) => item.id === id)
  }

  async getTags(itemId: string): Promise<string[]> {
    return (await this.getItem(itemId))?.tags ?? []
  }

  async addTag(itemId: string, tag: string): Promise<string[]> {
    this.items = this.items.map((item) =>
      item.id === itemId ? { ...item, tags: [...item.tags, tag] } : item
    )
    return this.getTags(itemId)
  }

  async removeTag(itemId: string, tag: string): Promise<string[]> {
    this.items = this.items.map((item) =>
      item.id === itemId ? { ...item, tags: item.tags.filter((value) => value !== tag) } : item
    )
    return this.getTags(itemId)
  }

  importCalls: string[] = []

  async importFile(path: string, meta?: Partial<LibraryItem>): Promise<LibraryItem> {
    this.importCalls.push(path)
    const item: LibraryItem = {
      id: meta?.id ?? path,
      name: meta?.name ?? path,
      tags: meta?.tags ?? [],
      path
    }
    this.items.push(item)
    return item
  }

  async refreshIndex(): Promise<void> {
    // no-op for in-memory
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
  async readFileMeta(path: string) {
    const name = path.split('/').pop() ?? path
    const ext = name.includes('.') ? name.split('.').pop() : undefined
    return { name, extension: ext }
  }
}

describe('browser store', () => {
  let libraryRepo: MemoryLibraryRepo
  let fileRepo: MemoryFileRepo

  beforeEach(() => {
    setActivePinia(createPinia())
    libraryRepo = new MemoryLibraryRepo([
      { id: '1', name: 'Kick One', tags: ['drum'] },
      { id: '2', name: 'Snare Tight', tags: ['snare'] }
    ])
    fileRepo = new MemoryFileRepo({
      dirs: [{ name: 'kits', path: '/kits' }],
      files: [{ name: 'new.wav', path: '/kits/new.wav' }]
    })
    __setLibraryRepositoryForTests(libraryRepo)
    __setFileSystemRepositoryForTests(fileRepo)
  })

  it('keeps library and files state separated on mode switch', async () => {
    const store = useBrowserStore()
    await store.setQuery('Kick')
    expect(store.library.results).toHaveLength(1)
    await store.setMode('FILES')
    expect(store.files.entries.files).toHaveLength(1)
    expect(store.library.query).toBe('Kick')
    await store.setMode('LIBRARY')
    expect(store.library.results).toHaveLength(1)
  })

  it('updates search results when query changes', async () => {
    const store = useBrowserStore()
    await store.setQuery('snare')
    expect(store.library.results[0]?.title).toContain('Snare')
  })

  it('persists tag changes through repository', async () => {
    const store = useBrowserStore()
    await store.search()
    await store.selectResult('1')
    await store.addTag('punch')
    expect(await libraryRepo.getTags('1')).toContain('punch')
    await store.removeTag('punch')
    expect(await libraryRepo.getTags('1')).not.toContain('punch')
  })

  it('lists directories and files for the current path', async () => {
    const store = useBrowserStore()
    await store.setMode('FILES')
    expect(store.files.entries.dirs[0]?.name).toBe('kits')
    expect(store.files.entries.files[0]?.name).toBe('new.wav')
  })

  it('imports selected file into library and refreshes search results', async () => {
    const store = useBrowserStore()
    await store.setMode('FILES')
    store.selectPath('/kits/new.wav')
    await store.importSelected()
    await store.setMode('LIBRARY')
    await store.search()
    expect(libraryRepo.importCalls).toContain('/kits/new.wav')
    expect(store.library.results.find((item) => item.title.includes('new.wav'))).toBeDefined()
  })
})
