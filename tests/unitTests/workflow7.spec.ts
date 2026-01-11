import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useBrowserStore } from '../../stores/browser'

// Mock composables
vi.mock('../../composables/useRecentFiles', () => ({
  useRecentFiles: () => ({
    addRecent: vi.fn(),
    getRecent: vi.fn(() => []),
    clearRecent: vi.fn(),
    removeRecent: vi.fn()
  })
}))

vi.mock('../../composables/useQuickBrowse', () => ({
  useQuickBrowse: () => ({
    recordBrowse: vi.fn(),
    getLastBrowse: vi.fn(),
    restoreBrowse: vi.fn()
  })
}))

// Mock repositories
vi.mock('../../services/libraryRepository', () => ({
  getLibraryRepository: vi.fn(() => ({
    importDirectory: vi.fn(async (_path, _options) => {
      // Simulate successful import
    }),
    search: vi.fn(async () => []),
    importFile: vi.fn(async () => 'item-1'),
    refreshIndex: vi.fn(async () => { }),
    getTags: vi.fn(async () => []),
    getFavorites: vi.fn(async () => []),
    addToFavorites: vi.fn(async () => { }),
    removeFromFavorites: vi.fn(async () => { }),
    isFavorite: vi.fn(async () => false),
    addTag: vi.fn(async () => { }),
    removeTag: vi.fn(async () => { }),
    getCategories: vi.fn(async () => []),
    getProducts: vi.fn(async () => []),
    getBanks: vi.fn(async () => []),
    getSubBanks: vi.fn(async () => [])
  }))
}))

vi.mock('../../services/fileSystemRepository', () => ({
  getFileSystemRepository: vi.fn(() => ({
    stat: vi.fn(async (path) => {
      // Return isDir: true for paths containing /samples/
      return { isDir: path.includes('/samples/') }
    }),
    listDir: vi.fn(async () => ({ dirs: [], files: [] }))
  }))
}))

describe('Workflow 7: Directory Import with Attribute Editor', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('opens import dialog when directory is selected for import', async () => {
    const store = useBrowserStore()
    await store.setMode('FILES')
    store.selectPath('/samples/drums')

    await store.importSelected()

    expect(store.importDialogOpen).toBe(true)
    expect(store.importDialogPath).toBe('/samples/drums')
  })

  it('confirms import with options', async () => {
    const store = useBrowserStore()
    store.openImportDialog('/samples/drums')

    await store.confirmImport({
      includeSubfolders: true,
      tags: ['drums', 'acoustic']
    })

    // Verify dialog was closed after import
    expect(store.importDialogOpen).toBe(false)
  })

  it('closes dialog on cancel', () => {
    const store = useBrowserStore()
    store.openImportDialog('/samples/drums')
    expect(store.importDialogOpen).toBe(true)

    store.closeImportDialog()
    expect(store.importDialogOpen).toBe(false)
    expect(store.importDialogPath).toBeNull()
  })
})
