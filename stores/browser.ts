import { defineStore } from 'pinia'
import { getFileSystemRepository, type DirectoryListing } from '../services/fileSystemRepository'
import { getLibraryRepository, type LibraryItem } from '../services/libraryRepository'
import type { EncoderField } from '../composables/use4DEncoder'
import type { BrowserMode, BrowserResultItem, BrowserFileEntry } from '../types/library'

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

export type BrowserFilters = {
  fileType?: 'sample' | 'kit' | 'pattern' | 'preset' | 'all'
  contentType?: 'factory' | 'user' | 'all'
  category?: string
  product?: string
  bank?: string
  subBank?: string
  character?: string
  tags?: string[]
  favorites?: boolean
}

const createInitialFilters = (): BrowserFilters => ({
  fileType: 'all',
  contentType: 'all',
  tags: [],
  favorites: false
})

const uniqueNonEmpty = (values: Array<string | undefined>): string[] => {
  const result = new Set(
    values
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      .map((value) => value.trim())
  )
  return Array.from(result)
}

const normalizeTags = (tags?: string[]) =>
  (tags ?? []).map((tag) => tag.trim().toLowerCase()).filter((tag) => tag.length > 0)

const matchesFilters = (item: BrowserResultItem, filters: BrowserFilters): boolean => {
  if (filters.fileType && filters.fileType !== 'all' && item.fileType !== filters.fileType) return false
  if (filters.contentType && filters.contentType !== 'all' && item.contentType !== filters.contentType) {
    return false
  }
  if (filters.category && item.category !== filters.category) return false
  if (filters.product && item.product !== filters.product) return false
  if (filters.bank && item.bank !== filters.bank) return false
  if (filters.subBank && item.subBank !== filters.subBank) return false
  if (filters.character && item.character !== filters.character) return false
  if (filters.favorites && item.favorites !== true) return false
  if (filters.tags && filters.tags.length > 0) {
    const requiredTags = normalizeTags(filters.tags)
    const itemTags = normalizeTags(item.tags)
    const hasAllTags = requiredTags.every((tag) => itemTags.includes(tag))
    if (!hasAllTags) return false
  }
  return true
}

const describeFilters = (filters: BrowserFilters): string => {
  const parts: string[] = []
  if (filters.fileType && filters.fileType !== 'all') parts.push(`Type: ${filters.fileType}`)
  if (filters.contentType && filters.contentType !== 'all') parts.push(`Content: ${filters.contentType}`)
  if (filters.category) parts.push(`Cat: ${filters.category}`)
  if (filters.product) parts.push(`Prod: ${filters.product}`)
  if (filters.bank) parts.push(`Bank: ${filters.bank}`)
  if (filters.tags && filters.tags.length > 0) parts.push(`Tags: ${filters.tags.join(', ')}`)
  if (filters.favorites) parts.push('Favs')
  return parts.join(', ')
}

const mapLibraryItemToResult = (item: LibraryItem): BrowserResultItem => ({
  id: item.id,
  title: item.name,
  ...(item.tags && item.tags.length > 0 ? { subtitle: item.tags.join(', '), tags: item.tags } : {}),
  ...(item.path ? { path: item.path } : {}),
  ...(item.fileType ? { fileType: item.fileType } : {}),
  ...(item.contentType ? { contentType: item.contentType } : {}),
  ...(item.category ? { category: item.category } : {}),
  ...(item.product ? { product: item.product } : {}),
  ...(item.bank ? { bank: item.bank } : {}),
  ...(item.subBank ? { subBank: item.subBank } : {}),
  ...(item.character ? { character: item.character } : {}),
  ...(item.favorites ? { favorites: item.favorites } : {})
})

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
    } as FilesState,
    filters: createInitialFilters() as BrowserFilters,
    availableCategories: [] as string[],
    availableProducts: [] as string[],
    availableBanks: [] as string[]
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
      const results = await repo.search(this.library.query ?? '', this.filters)
      const mapped = results.map(mapLibraryItemToResult)
      this.availableCategories = uniqueNonEmpty(mapped.map((item) => item.category))
      this.availableProducts = uniqueNonEmpty(mapped.map((item) => item.product))
      this.availableBanks = uniqueNonEmpty(mapped.map((item) => item.bank))
      const filtered = mapped.filter((item) => matchesFilters(item, this.filters))
      this.library.results = filtered
      if (this.library.selectedId && !filtered.find((entry) => entry.id === this.library.selectedId)) {
        this.library.selectedId = null
      }
    },
    setFilter<K extends keyof BrowserFilters>(key: K, value: BrowserFilters[K]) {
      const nextValue = Array.isArray(value) ? [...value] : value
      this.filters = { ...this.filters, [key]: nextValue } as BrowserFilters
      void this.applyFilters()
    },
    async clearFilters() {
      this.filters = createInitialFilters()
      await this.applyFilters()
    },
    async applyFilters() {
      await this.search()
    },
    getAvailableOptions(filterKey: string): string[] {
      switch (filterKey) {
        case 'fileType':
          return ['all', 'sample', 'kit', 'pattern', 'preset']
        case 'contentType':
          return ['all', 'factory', 'user']
        case 'category':
          return this.availableCategories
        case 'product':
          return this.availableProducts
        case 'bank':
          return this.availableBanks
        default:
          return []
      }
    },
    getEncoderFields(): EncoderField[] {
      return [
        {
          id: 'fileType',
          label: 'Type',
          value: this.filters.fileType ?? 'all',
          options: this.getAvailableOptions('fileType')
        },
        {
          id: 'contentType',
          label: 'Factory/User',
          value: this.filters.contentType ?? 'all',
          options: this.getAvailableOptions('contentType')
        },
        {
          id: 'category',
          label: 'Category',
          value: this.filters.category ?? '',
          options: this.getAvailableOptions('category')
        },
        {
          id: 'product',
          label: 'Product',
          value: this.filters.product ?? '',
          options: this.getAvailableOptions('product')
        },
        {
          id: 'bank',
          label: 'Bank',
          value: this.filters.bank ?? '',
          options: this.getAvailableOptions('bank')
        },
        {
          id: 'tags',
          label: 'Tags',
          value: (this.filters.tags ?? []).join(', ')
        },
        {
          id: 'favorites',
          label: 'Favorites',
          value: this.filters.favorites ? 'on' : 'off',
          options: ['off', 'on']
        }
      ]
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
          subtitle: [this.library.query || 'All', describeFilters(this.filters)].filter(Boolean).join(' • ')
        }
      ]
      const rightItems: DisplayListItem[] = this.library.results.map((result) => {
        const entry: DisplayListItem = {
          title: result.title,
          active: result.id === this.library.selectedId,
          value: result.id
        }
        if (result.subtitle) {
          entry.subtitle = result.subtitle
        }
        return entry
      })
      const leftSummary = [this.library.query || 'All', describeFilters(this.filters)].filter(Boolean).join(' • ')
      return {
        leftModel: {
          view: 'BROWSER',
          title: 'Library',
          summary: leftSummary,
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
