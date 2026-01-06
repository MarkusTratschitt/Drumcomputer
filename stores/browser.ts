import { defineStore } from 'pinia'
import { getFileSystemRepository, type DirectoryListing } from '@/services/fileSystemRepository'
import { getLibraryRepository, type LibraryItem } from '@/services/libraryRepository'
import type { BrowserMode, BrowserResultItem, BrowserFileEntry } from '@/types/library'

type DisplayListItem = {
  title: string
  subtitle?: string
  active?: boolean
  value?: string
}

type DisplayPanelModel = {
  view: 'BROWSER' | 'FILE'
  title?: string
  summary?: string
  items?: DisplayListItem[]
}

type LibraryState = {
  query: string
  results: BrowserResultItem[]
  selectedId: string | null
}

type FilesState = {
  currentPath: string
  entries: DirectoryListing
  selectedPath: string | null
}

const emptyListing: DirectoryListing = { dirs: [], files: [] }

export const useBrowserStore = defineStore('browser', {
  state: () => ({
    mode: 'LIBRARY' as BrowserMode,
    library: {
      query: '',
      results: [],
      selectedId: null
    } as LibraryState,
    files: {
      currentPath: '/',
      entries: emptyListing,
      selectedPath: null
    } as FilesState
  }),
  actions: {
    async setMode(mode: BrowserMode) {
      this.mode = mode
      if (mode === 'LIBRARY') {
        await this.search()
      } else {
        await this.listDir(this.files.currentPath || '/')
      }
    },
    async setQuery(query: string) {
      this.library.query = query
      await this.search()
    },
    async search() {
      const repo = getLibraryRepository()
      const results = await repo.search(this.library.query ?? '', {})
      this.library.results = results.map((item) => ({
        id: item.id,
        title: item.name,
        subtitle: item.tags?.join(', ') ?? '',
        path: item.path,
        tags: item.tags
      }))
      if (this.library.selectedId && !results.find((entry) => entry.id === this.library.selectedId)) {
        this.library.selectedId = null
      }
    },
    async selectResult(id: string | null) {
      this.library.selectedId = id
    },
    async addTag(tag: string) {
      if (!this.library.selectedId) return
      const repo = getLibraryRepository()
      await repo.addTag(this.library.selectedId, tag)
      await this.search()
    },
    async removeTag(tag: string) {
      if (!this.library.selectedId) return
      const repo = getLibraryRepository()
      await repo.removeTag(this.library.selectedId, tag)
      await this.search()
    },
    async listDir(path: string) {
      const repo = getFileSystemRepository()
      this.files.currentPath = path || '/'
      this.files.entries = await repo.listDir(this.files.currentPath)
      if (this.files.selectedPath && !this.files.entries.files.find((file) => file.path === this.files.selectedPath)) {
        this.files.selectedPath = null
      }
    },
    selectPath(path: string | null) {
      this.files.selectedPath = path
    },
    async importSelected() {
      if (!this.files.selectedPath) return
      const repo = getLibraryRepository()
      await repo.importFile(this.files.selectedPath)
      await repo.refreshIndex()
      await this.search()
    },
    toDisplayModels(): { leftModel: DisplayPanelModel; rightModel: DisplayPanelModel } {
      if (this.mode === 'FILES') {
        const leftItems: DisplayListItem[] = this.files.entries.dirs.map((dir) => ({
          title: dir.name,
          subtitle: dir.path
        }))
        const rightItems: DisplayListItem[] = this.files.entries.files.map((file) => ({
          title: file.name,
          subtitle: file.path,
          active: file.path === this.files.selectedPath
        }))
        return {
          leftModel: {
            view: 'FILE',
            title: 'Directories',
            summary: this.files.currentPath,
            items: leftItems
          },
          rightModel: {
            view: 'FILE',
            title: 'Files',
            summary: 'Select a file to import',
            items: rightItems
          }
        }
      }
      const leftItems: DisplayListItem[] = [
        {
          title: 'Search',
          subtitle: this.library.query || 'All'
        }
      ]
      const rightItems: DisplayListItem[] = this.library.results.map((result) => ({
        title: result.title,
        subtitle: result.subtitle,
        active: result.id === this.library.selectedId,
        value: result.id
      }))
      return {
        leftModel: {
          view: 'BROWSER',
          title: 'Library',
          summary: this.library.query || 'All',
          items: leftItems
        },
        rightModel: {
          view: 'BROWSER',
          title: 'Results',
          summary: `${rightItems.length} items`,
          items: rightItems
        }
      }
    }
  }
})
