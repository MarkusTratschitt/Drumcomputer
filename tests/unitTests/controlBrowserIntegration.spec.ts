import { describe, it, beforeEach, expect } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useControlStore } from '@/stores/control'
import { useBrowserStore } from '@/stores/browser'
import { __setLibraryRepositoryForTests, type LibraryRepository } from '@/services/libraryRepository'

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
})
