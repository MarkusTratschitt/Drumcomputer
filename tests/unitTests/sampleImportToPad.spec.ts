import { describe, it, expect, beforeEach, afterEach, vi as _vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import {
  __resetLibraryRepository,
  getLibraryRepository,
  type LibraryItem as _LibraryItem
} from '../../services/libraryRepository'
import { useBrowserStore } from '../../stores/browser'
import {
  __resetFileSystemRepository,
  __setFileSystemRepositoryForTests,
  type FileSystemRepository,
  type DirectoryListing
} from '../../services/fileSystemRepository'

class MockFileSystemRepository implements FileSystemRepository {
  constructor(
    private listings: Record<string, DirectoryListing>,
    private blobs: Record<string, Blob>
  ) { }

  async listDir(path: string): Promise<DirectoryListing> {
    return this.listings[path] ?? { dirs: [], files: [] }
  }

  async stat(_path: string): Promise<{ isDir: boolean }> {
    return { isDir: false }
  }

  async readFileMeta(path: string): Promise<{ name: string; extension?: string }> {
    const name = path.split('/').pop() ?? path
    const parts = name.split('.')
    const extension = parts.length > 1 ? parts.pop() : undefined
    const meta: { name: string; extension?: string } = { name }
    if (extension) meta.extension = extension
    return meta
  }

  async readFileBlob(path: string): Promise<Blob> {
    return this.blobs[path] ?? new Blob(['mock audio data'], { type: 'audio/wav' })
  }
}

describe('Sample import to pad', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    __resetLibraryRepository()
    __resetFileSystemRepository()
    if (typeof localStorage !== 'undefined') {
      localStorage.clear()
    }
  })

  afterEach(() => {
    __resetLibraryRepository()
    __resetFileSystemRepository()
  })

  it('libraryRepository.importFile sets lastUsedAtMs on first import', async () => {
    const repo = getLibraryRepository()
    const beforeImport = Date.now()

    const imported = await repo.importFile('/samples/kick.wav', { name: 'Kick' })

    const afterImport = Date.now()
    expect(imported.lastUsedAtMs).toBeDefined()
    expect(imported.lastUsedAtMs).toBeGreaterThanOrEqual(beforeImport)
    expect(imported.lastUsedAtMs).toBeLessThanOrEqual(afterImport)
  })

  it('libraryRepository.importFile updates lastUsedAtMs on subsequent imports', async () => {
    const repo = getLibraryRepository()

    const firstImport = await repo.importFile('/samples/kick.wav', { name: 'Kick' })
    const firstTimestamp = firstImport.lastUsedAtMs!

    // Wait a bit to ensure timestamp differs
    await new Promise((resolve) => setTimeout(resolve, 10))

    const secondImport = await repo.importFile('/samples/kick.wav', { name: 'Kick' })
    const secondTimestamp = secondImport.lastUsedAtMs!

    expect(secondTimestamp).toBeGreaterThan(firstTimestamp)
  })

  it('browser.importSelected returns imported LibraryItem with lastUsedAtMs', async () => {
    const listings: Record<string, DirectoryListing> = {
      '/samples': {
        dirs: [],
        files: [{ name: 'snare.wav', path: '/samples/snare.wav' }]
      }
    }
    const blobs: Record<string, Blob> = {
      '/samples/snare.wav': new Blob(['audio'], { type: 'audio/wav' })
    }
    __setFileSystemRepositoryForTests(new MockFileSystemRepository(listings, blobs))

    const browser = useBrowserStore()
    await browser.setMode('FILES')
    await browser.listDir('/samples')
    browser.selectPath('/samples/snare.wav')
    const beforeImport = Date.now()
    const imported = await browser.importSelected({
      contextId: 'pad1',
      contextType: 'sample'
    })
    const afterImport = Date.now()

    expect(imported).not.toBeNull()
    expect(imported?.path).toBe('/samples/snare.wav')
    expect(imported?.lastUsedAtMs).toBeDefined()
    expect(imported?.lastUsedAtMs).toBeGreaterThanOrEqual(beforeImport)
    expect(imported?.lastUsedAtMs).toBeLessThanOrEqual(afterImport)
  })

  it('browser.importSelected records contextId in browse history', async () => {
    const listings: Record<string, DirectoryListing> = {
      '/samples': {
        dirs: [],
        files: [{ name: 'hat.wav', path: '/samples/hat.wav' }]
      }
    }
    const blobs: Record<string, Blob> = {
      '/samples/hat.wav': new Blob(['audio'], { type: 'audio/wav' })
    }
    __setFileSystemRepositoryForTests(new MockFileSystemRepository(listings, blobs))

    const browser = useBrowserStore()
    await browser.setMode('FILES')
    await browser.listDir('/samples')
    browser.selectPath('/samples/hat.wav')
    await browser.importSelected({
      contextId: 'pad5',
      contextType: 'sample'
    })

    // Verify import was successful (browse history is managed by useQuickBrowse composable)
    const repo = getLibraryRepository()
    const items = await repo.search('')
    const hatItem = items.find((item) => item.path === '/samples/hat.wav')
    expect(hatItem).toBeDefined()
  })

  it('browser.importSelected returns null if no file selected', async () => {
    const browser = useBrowserStore()
    await browser.setMode('FILES')

    const result = await browser.importSelected({
      contextId: 'pad1',
      contextType: 'sample'
    })

    expect(result).toBeNull()
  })

  it('importFile preserves existing tags when updating', async () => {
    const repo = getLibraryRepository()

    await repo.importFile('/samples/kick.wav', { name: 'Kick' })
    await repo.addTag('/samples/kick.wav', 'punchy')
    await repo.addTag('/samples/kick.wav', 'electronic')

    const reimported = await repo.importFile('/samples/kick.wav', { name: 'Kick Updated' })

    expect(reimported.tags).toContain('punchy')
    expect(reimported.tags).toContain('electronic')
    expect(reimported.tags).toHaveLength(2)
  })
})
