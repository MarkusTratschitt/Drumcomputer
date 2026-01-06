import { describe, it, beforeEach, expect } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useControlStore } from '../../stores/control'
import { useBrowserStore } from '../../stores/browser'
import { __setLibraryRepositoryForTests, type LibraryRepository } from '../../services/libraryRepository'
import { __setFileSystemRepositoryForTests } from '../../services/fileSystemRepository'

class ImportTrackingRepo implements LibraryRepository {
  imports: string[] = []
  items = []
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
    await browser.setMode('FILES')
    browser.selectPath('/imports/sample.wav')
    control.setMode('FILE')
    control.applyAction('BROWSER_LOAD')
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
})
