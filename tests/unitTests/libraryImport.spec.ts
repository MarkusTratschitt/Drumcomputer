import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  __resetLibraryRepository,
  getLibraryRepository
} from '../../services/libraryRepository'
import {
  __resetFileSystemRepository,
  __setFileSystemRepositoryForTests,
  type FileSystemRepository,
  type DirectoryListing
} from '../../services/fileSystemRepository'

class MockFileSystemRepository implements FileSystemRepository {
  constructor(private listings: Record<string, DirectoryListing>, private throwOn?: Set<string>) {}

  async listDir(path: string): Promise<DirectoryListing> {
    if (this.throwOn?.has(path)) {
      throw new Error('Read error')
    }
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
}

describe('library import directory', () => {
  beforeEach(() => {
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

  it('imports recursively and reports progress with metadata', async () => {
    const listings: Record<string, DirectoryListing> = {
      '/': {
        dirs: [{ name: 'Drums', path: '/Drums' }],
        files: [{ name: 'readme.txt', path: '/readme.txt' }]
      },
      '/Drums': {
        dirs: [{ name: 'KitA', path: '/Drums/KitA' }],
        files: [{ name: 'kick.wav', path: '/Drums/kick.wav' }]
      },
      '/Drums/KitA': {
        dirs: [{ name: 'Bank1', path: '/Drums/KitA/Bank1' }],
        files: []
      },
      '/Drums/KitA/Bank1': {
        dirs: [{ name: 'Sub', path: '/Drums/KitA/Bank1/Sub' }],
        files: [{ name: 'snare.aiff', path: '/Drums/KitA/Bank1/snare.aiff' }]
      },
      '/Drums/KitA/Bank1/Sub': {
        dirs: [],
        files: [{ name: 'loop.wav', path: '/Drums/KitA/Bank1/Sub/loop.wav' }]
      }
    }
    __setFileSystemRepositoryForTests(new MockFileSystemRepository(listings))

    const repo = getLibraryRepository()
    const progressCalls: Array<{ total: number; completed: number; current: string; errors: string[] }> = []

    await repo.importDirectory?.('/', { recursive: true }, (progress) => progressCalls.push(progress))

    expect(progressCalls).toHaveLength(3)
    expect(progressCalls[2]?.completed).toBe(3)
    expect(progressCalls[2]?.total).toBe(3)
    expect(progressCalls[2]?.errors).toContain('/readme.txt')

    const items = await repo.search('')
    const loopItem = items.find((item) => item.path === '/Drums/KitA/Bank1/Sub/loop.wav')
    expect(loopItem?.category).toBe('Drums')
    expect(loopItem?.product).toBe('KitA')
    expect(loopItem?.bank).toBe('Bank1')
    expect(loopItem?.subBank).toBe('Sub')
    expect(loopItem?.vendor).toBe('user')
  })

  it('records errors for unsupported formats and import failures', async () => {
    const listings: Record<string, DirectoryListing> = {
      '/': {
        dirs: [],
        files: [
          { name: 'bad.wav', path: '/bad.wav' },
          { name: 'note.txt', path: '/note.txt' }
        ]
      }
    }
    __setFileSystemRepositoryForTests(new MockFileSystemRepository(listings))

    const repo = getLibraryRepository()
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const originalImport = repo.importFile.bind(repo)
    repo.importFile = async (path, meta) => {
      if (path === '/bad.wav') {
        throw new Error('Import failed')
      }
      return originalImport(path, meta)
    }

    const progressCalls: Array<{ total: number; completed: number; current: string; errors: string[] }> = []
    await repo.importDirectory?.('/', undefined, (progress) => progressCalls.push(progress))

    expect(progressCalls).toHaveLength(1)
    expect(progressCalls[0]?.errors).toContain('/bad.wav')
    expect(progressCalls[0]?.errors).toContain('/note.txt')
    expect(warnSpy).toHaveBeenCalled()

    warnSpy.mockRestore()
  })
})
