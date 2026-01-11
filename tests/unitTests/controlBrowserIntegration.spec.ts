import { describe, it, beforeEach, expect, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useControlStore } from '../../stores/control'
import { useBrowserStore } from '../../stores/browser'
import { __setLibraryRepositoryForTests, type LibraryItem, type LibraryRepository } from '../../services/libraryRepository'
import { __setFileSystemRepositoryForTests } from '../../services/fileSystemRepository'

class ImportTrackingRepo implements LibraryRepository {
  imports: string[] = []
  items: LibraryItem[] = []
  favorites = new Set<string>()
  async search(_query: string, _filters?: unknown) {
    return this.items
  }
  async getItem() {
    return undefined
  }
  async getTags() {
    return []
  }
  async addTag() {
    return []
  }
  async removeTag() {
    return []
  }
  async importFile(path: string) {
    this.imports.push(path)
    const item = { id: path, name: path, tags: [] }
    this.items.push(item)
    return item
  }
  async refreshIndex() {
    return
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
  async importDirectory(): Promise<void> {
    return
  }
}

describe('control to browser wiring', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    __setLibraryRepositoryForTests(new ImportTrackingRepo())
  })

  it('initializes 4D encoder when entering browser modes', () => {
    const control = useControlStore()
    control.setMode('BROWSER')
    expect(control.encoder4D).not.toBeNull()
    expect(control.encoder4D?.fields.value[0]?.id).toBe('fileType')
  })

  it('navigates encoder fields horizontally', () => {
    const control = useControlStore()
    control.setMode('BROWSER')
    control.tiltEncoder4D('right')
    expect(control.encoder4D?.activeFieldIndex.value).toBe(1)
  })

  it('syncs filter changes when turning encoder in value mode', async () => {
    const browser = useBrowserStore()
    const control = useControlStore()
    control.setMode('BROWSER')
    control.encoder4D?.setMode('value-adjust')
    control.turnEncoder4D(1)
    expect(browser.filters.fileType).toBe('sample')
  })

  it('invokes browser import when triggering load action', async () => {
    const browser = useBrowserStore()
    const control = useControlStore()
    const repo = new ImportTrackingRepo()
    __setLibraryRepositoryForTests(repo)
    __setFileSystemRepositoryForTests({
      async listDir() {
        return { dirs: [], files: [{ name: 'sample.wav', path: '/imports/sample.wav' }] }
      },
      async stat() {
        return { isDir: false }
      },
      async readFileMeta(path: string): Promise<{ name: string; extension?: string }> {
        const name = path.split('/').pop() ?? path
        const ext = name.includes('.') ? name.split('.').pop() : undefined
        const meta: { name: string; extension?: string } = { name }
        if (ext) meta.extension = ext
        return meta
      }
    })
    await browser.setMode('FILES')
    browser.selectPath('/imports/sample.wav')
    control.setMode('FILE')
    await browser.importSelected()
    expect(repo.imports).toContain('/imports/sample.wav')
  })

  it('loads file via encoder press in list navigate mode', async () => {
    const browser = useBrowserStore()
    const control = useControlStore()
    const repo = new ImportTrackingRepo()
    __setLibraryRepositoryForTests(repo)
    __setFileSystemRepositoryForTests({
      async listDir() {
        return { dirs: [], files: [{ name: 'clip.wav', path: '/clip.wav' }] }
      },
      async stat() {
        return { isDir: false }
      },
      async readFileMeta(path: string): Promise<{ name: string; extension?: string }> {
        const name = path.split('/').pop() ?? path
        const ext = name.includes('.') ? name.split('.').pop() : undefined
        const meta: { name: string; extension?: string } = { name }
        if (ext) meta.extension = ext
        return meta
      }
    })
    await browser.setMode('FILES')
    control.setMode('FILE')
    control.encoder4D?.setMode('list-navigate')
    control.syncListSelection()
    await control.pressEncoder4D()
    expect(repo.imports.length).toBeGreaterThan(0)
    expect(repo.imports[0]).toBe(browser.files.selectedPath)
  })

  it('runs a browser workflow: filter, search, load', async () => {
    const control = useControlStore()
    const browser = useBrowserStore()
    const repo = new ImportTrackingRepo()
    repo.items = [{ id: '1', name: 'Kick', tags: [], fileType: 'sample' }]
    __setLibraryRepositoryForTests(repo)
    __setFileSystemRepositoryForTests({
      async listDir() {
        return { dirs: [], files: [{ name: 'kick.wav', path: '/kick.wav' }] }
      },
      async stat() {
        return { isDir: false }
      },
      async readFileMeta(path: string): Promise<{ name: string; extension?: string }> {
        const name = path.split('/').pop() ?? path
        const ext = name.includes('.') ? name.split('.').pop() : undefined
        const meta: { name: string; extension?: string } = { name }
        if (ext) meta.extension = ext
        return meta
      }
    })
    control.setMode('BROWSER')
    browser.setFilter('fileType', 'sample')
    await browser.search()
    await browser.setMode('FILES')
    browser.selectPath('/kick.wav')
    control.setMode('FILE')
    await browser.importSelected()
    expect(repo.imports).toContain('/kick.wav')
  })

  it('runs recent → quick browse restore → load workflow', async () => {
    const control = useControlStore()
    const browser = useBrowserStore()
    const repo = new ImportTrackingRepo()
    __setLibraryRepositoryForTests(repo)
    __setFileSystemRepositoryForTests({
      async listDir() {
        return { dirs: [], files: [{ name: 'hat.wav', path: '/hat.wav' }] }
      },
      async stat() {
        return { isDir: false }
      },
      async readFileMeta(path: string): Promise<{ name: string; extension?: string }> {
        const name = path.split('/').pop() ?? path
        const ext = name.includes('.') ? name.split('.').pop() : undefined
        const meta: { name: string; extension?: string } = { name }
        if (ext) meta.extension = ext
        return meta
      }
    })
    await browser.setMode('FILES')
    browser.selectPath('/hat.wav')
    await browser.importSelected({ contextId: 'pad-0', contextType: 'sample' })
    browser.openQuickBrowse('pad-0')
    await new Promise((resolve) => setTimeout(resolve, 0))
    browser.selectPath('/hat.wav')
    control.setMode('FILE')
    control.applyAction('BROWSER_LOAD')
    expect(repo.imports).toContain('/hat.wav')
  })

  it('runs favorites → filter → load workflow', async () => {
    const control = useControlStore()
    const browser = useBrowserStore()
    const repo = new ImportTrackingRepo()
    repo.items = [
      { id: '1', name: 'Kick', tags: [], fileType: 'sample' },
      { id: '2', name: 'Snare', tags: [], fileType: 'sample' }
    ]
    __setLibraryRepositoryForTests(repo)
    __setFileSystemRepositoryForTests({
      async listDir() {
        return { dirs: [], files: [{ name: 'snare.wav', path: '/snare.wav' }] }
      },
      async stat() {
        return { isDir: false }
      },
      async readFileMeta(path: string): Promise<{ name: string; extension?: string }> {
        const name = path.split('/').pop() ?? path
        const ext = name.includes('.') ? name.split('.').pop() : undefined
        const meta: { name: string; extension?: string } = { name }
        if (ext) meta.extension = ext
        return meta
      }
    })
    control.setMode('BROWSER')
    await browser.search()
    await browser.toggleFavorite('2')
    browser.setFilter('favorites', true)
    await browser.applyFilters()
    expect(browser.library.results.map((item) => item.id)).toEqual(['2'])
    await browser.setMode('FILES')
    browser.selectPath('/snare.wav')
    control.setMode('FILE')
    await browser.importSelected()
    expect(repo.imports).toContain('/snare.wav')
  })

  it('runs preview → stop → load workflow', async () => {
    const control = useControlStore()
    const browser = useBrowserStore()
    const repo = new ImportTrackingRepo()
    __setLibraryRepositoryForTests(repo)
    __setFileSystemRepositoryForTests({
      async listDir() {
        return { dirs: [], files: [{ name: 'tone.wav', path: '/tone.wav' }] }
      },
      async stat() {
        return { isDir: false }
      },
      async readFileMeta(path: string): Promise<{ name: string; extension?: string }> {
        const name = path.split('/').pop() ?? path
        const ext = name.includes('.') ? name.split('.').pop() : undefined
        const meta: { name: string; extension?: string } = { name }
        if (ext) meta.extension = ext
        return meta
      },
      async readFileBlob() {
        return new Blob(['tone'], { type: 'audio/wav' })
      }
    })
    await browser.setMode('FILES')
    browser.selectPath('/tone.wav')
    control.setMode('BROWSER')
    control.applyAction('BROWSER_PREHEAR')
    control.applyAction('BROWSER_STOP')
    control.setMode('FILE')
    await browser.importSelected()
    expect(repo.imports).toContain('/tone.wav')
  })

  it('handles empty results without selection', async () => {
    const browser = useBrowserStore()
    await browser.search()
    expect(browser.library.results).toHaveLength(0)
    expect(browser.library.selectedId).toBeNull()
  })

  it('surfaces permission denial on file system list', async () => {
    const browser = useBrowserStore()
    __setFileSystemRepositoryForTests({
      async listDir() {
        throw new Error('Permission denied')
      },
      async stat() {
        return { isDir: false }
      },
      async readFileMeta(path: string): Promise<{ name: string; extension?: string }> {
        return { name: path }
      }
    })
    await expect(browser.setMode('FILES')).rejects.toThrow('Permission denied')
  })

  it('surfaces import errors', async () => {
    const browser = useBrowserStore()
    const repo = new ImportTrackingRepo()
    repo.importFile = async () => {
      throw new Error('Import failed')
    }
    __setLibraryRepositoryForTests(repo)
    __setFileSystemRepositoryForTests({
      async listDir() {
        return { dirs: [], files: [{ name: 'broken.wav', path: '/broken.wav' }] }
      },
      async stat() {
        return { isDir: false }
      },
      async readFileMeta(path: string): Promise<{ name: string; extension?: string }> {
        return { name: path }
      }
    })
    await browser.setMode('FILES')
    browser.selectPath('/broken.wav')
    await expect(browser.importSelected()).rejects.toThrow('Import failed')
  })

  it('imports selected file when encoder press is used in FILE mode', async () => {
    const control = useControlStore()
    const browser = useBrowserStore()
    const repo = new ImportTrackingRepo()
    __setLibraryRepositoryForTests(repo)
    __setFileSystemRepositoryForTests({
      async listDir() {
        return { dirs: [], files: [{ name: 'kick.wav', path: '/kick.wav' }] }
      },
      async stat() {
        return { isDir: false }
      },
      async readFileMeta(path: string): Promise<{ name: string; extension?: string }> {
        const name = path.split('/').pop() ?? path
        const ext = name.includes('.') ? name.split('.').pop() : undefined
        const meta: { name: string; extension?: string } = { name }
        if (ext) meta.extension = ext
        return meta
      }
    })

    await browser.setMode('FILES')
    browser.selectPath('/kick.wav')
    control.setMode('FILE')
    control.encoder4D?.setMode('list-navigate')
    if (control.encoder4D) {
      control.encoder4D.activeListIndex.value = 0
    }

    await control.pressEncoder4D()

    expect(repo.imports).toContain('/kick.wav')
  })

  it('marks active tag item in display models when encoder selects tag', async () => {
    const control = useControlStore()
    const browser = useBrowserStore()
    const repo = new ImportTrackingRepo()
    repo.items = [
      { id: '1', name: 'Kick', tags: ['dry', 'punch'] }
    ]
    __setLibraryRepositoryForTests(repo)
    __setFileSystemRepositoryForTests({
      async listDir() {
        return { dirs: [], files: [] }
      },
      async stat() {
        return { isDir: false }
      },
      async readFileMeta(path: string): Promise<{ name: string; extension?: string }> {
        return { name: path }
      }
    })

    control.setMode('BROWSER')
    await browser.search()
    await browser.selectResult('1')
    await browser.openTagDialog('1')
    control.initEncoderForBrowser()
    control.encoder4D?.setMode('list-navigate')
    if (control.encoder4D) {
      control.encoder4D.activeListIndex.value = 1
    }

    control.syncBrowserDisplay()

    const leftItems = control.browserDisplay?.leftModel.items ?? []
    expect(leftItems[1]?.active).toBe(true)
    expect(leftItems.filter((item) => item?.active).length).toBe(1)
  })

  it('passes correct contextId when pressing encoder4D after setImportContext', async () => {
    const control = useControlStore()
    const browser = useBrowserStore()
    const repo = new ImportTrackingRepo()
    __setLibraryRepositoryForTests(repo)
    __setFileSystemRepositoryForTests({
      async listDir() {
        return { dirs: [], files: [{ name: 'sample.wav', path: '/sample.wav' }] }
      },
      async stat() {
        return { isDir: false }
      },
      async readFileMeta(path: string): Promise<{ name: string; extension?: string }> {
        const name = path.split('/').pop() ?? path
        const ext = name.includes('.') ? name.split('.').pop() : undefined
        const meta: { name: string; extension?: string } = { name }
        if (ext) meta.extension = ext
        return meta
      }
    })

    // Set up: import context and FILE mode with selected file
    control.setImportContext('pad5')
    await browser.setMode('FILES')
    browser.selectPath('/sample.wav')
    control.setMode('FILE')
    control.encoder4D?.setMode('list-navigate')

    // Spy on importSelected to capture the context argument
    const importSpy = vi.spyOn(browser, 'importSelected')

    // Press encoder4D in list-navigate mode
    await control.pressEncoder4D()

    // Verify importSelected was called with correct contextId and contextType
    expect(importSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        contextId: 'pad5',
        contextType: 'sample'
      })
    )
  })

  it('imports library result on encoder press in browser mode with pad context', async () => {
    const control = useControlStore()
    const browser = useBrowserStore()
    const repo = new ImportTrackingRepo()
    repo.items = [
      { id: '/kits/kick.wav', name: 'Kick', path: '/kits/kick.wav', tags: [] }
    ]
    __setLibraryRepositoryForTests(repo)

    control.setMode('BROWSER')
    await browser.search()
    await browser.selectResult('/kits/kick.wav')
    control.setImportContext('pad12')
    control.encoder4D?.setMode('list-navigate')
    control.syncListSelection()

    const importSpy = vi.spyOn(browser, 'importSelected')

    await control.pressEncoder4D()

    expect(importSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        contextId: 'pad12',
        contextType: 'sample'
      })
    )
    expect(repo.imports).toContain('/kits/kick.wav')
  })
})
