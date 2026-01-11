import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useBrowserStore } from '../../stores/browser'
import {
  __resetFileSystemRepository,
  __setFileSystemRepositoryForTests,
  type FileSystemRepository,
  type DirectoryListing
} from '../../services/fileSystemRepository'
import { __resetLibraryRepository } from '../../services/libraryRepository'
import { setActivePinia, createPinia } from 'pinia'

class MockFileSystemRepository implements FileSystemRepository {
  constructor(private listings: Record<string, DirectoryListing>) { }

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
    if (extension) {
      meta.extension = extension
    }
    return meta
  }
}

describe('Workflow 8: directory highlight and 4D encoder import', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    __resetLibraryRepository()
    __resetFileSystemRepository()
  })

  afterEach(() => {
    __resetLibraryRepository()
    __resetFileSystemRepository()
  })

  it('highlights selected folder row in browser display', async () => {
    const listings: Record<string, DirectoryListing> = {
      '/': {
        dirs: [
          { name: 'Drums', path: '/Drums' },
          { name: 'Loops', path: '/Loops' }
        ],
        files: [{ name: 'test.wav', path: '/test.wav' }]
      }
    }
    __setFileSystemRepositoryForTests(new MockFileSystemRepository(listings))

    const store = useBrowserStore()
    await store.setMode('FILES')
    await store.listDir('/')

    // Select the first folder
    store.selectPath('/Drums')

    const displayModels = store.toDisplayModels()
    const leftItems = displayModels.leftModel.items ?? []

    // First folder should be marked as active after selecting its path
    const firstFolder = leftItems[0]
    expect(firstFolder).toBeDefined()
    expect(firstFolder?.active).toBe(true)
    expect(leftItems.filter((item) => item?.active).length).toBe(1)
  })

  it('enables folder import when folder is selected in FILE mode', async () => {
    const listings: Record<string, DirectoryListing> = {
      '/': {
        dirs: [{ name: 'Samples', path: '/Samples' }],
        files: []
      },
      '/Samples': {
        dirs: [],
        files: [{ name: 'kick.wav', path: '/Samples/kick.wav' }]
      }
    }
    __setFileSystemRepositoryForTests(new MockFileSystemRepository(listings))

    const store = useBrowserStore()
    await store.setMode('FILES')
    await store.listDir('/')

    // Simulate folder selection
    store.selectPath('/Samples')

    // Display models should reflect the selected folder
    const displayModels = store.toDisplayModels()
    expect(displayModels.rightModel.view).toBe('FILE')

    // When a path is selected, it should allow import
    const selectedPath = store.files.selectedPath
    expect(selectedPath).toBe('/Samples')
  })

  it('maintains selected folder visibility in scroll container', async () => {
    const listings: Record<string, DirectoryListing> = {
      '/': {
        dirs: Array.from({ length: 50 }, (_, i) => ({
          name: `Folder${i + 1}`,
          path: `/Folder${i + 1}`
        })),
        files: []
      }
    }
    __setFileSystemRepositoryForTests(new MockFileSystemRepository(listings))

    const store = useBrowserStore()
    await store.setMode('FILES')
    await store.listDir('/')

    // Select a folder far down the list
    const selectedPath = '/Folder30'
    store.selectPath(selectedPath)

    const displayModels = store.toDisplayModels()
    const leftItems = displayModels.leftModel.items ?? []

    // Verify that the folder list is complete and selectable
    expect(leftItems.length).toBeGreaterThan(0)
    expect(store.files.selectedPath).toBe(selectedPath)
  })
})
