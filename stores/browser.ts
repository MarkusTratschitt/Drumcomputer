import { defineStore } from 'pinia'
import { markRaw } from 'vue'
import { getFileSystemRepository, type DirectoryListing } from '../services/fileSystemRepository'
import { getLibraryRepository, type LibraryItem } from '../services/libraryRepository'
import { useRecentFiles, type RecentFileEntry } from '../composables/useRecentFiles'
import { useSamplePreview, type PreviewState } from '../composables/useSamplePreview.client'
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
  rawResults: BrowserResultItem[]
  selectedId: string | null
}

type FilesState = {
  currentPath: string
  entries: DirectoryListing
  rawEntries: DirectoryListing
  selectedPath: string | null
}

const emptyListing: DirectoryListing = { dirs: [], files: [] }

export type SortMode = 'name-asc' | 'name-desc' | 'date-asc' | 'date-desc' | 'relevance'

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

const mapLibraryItemToResult = (item: LibraryItem, isFavorite: boolean): BrowserResultItem => ({
  id: item.id,
  title: item.name,
  ...(item.tags && item.tags.length > 0 ? { subtitle: item.tags.join(', '), tags: item.tags } : {}),
  ...(item.path ? { path: item.path } : {}),
  ...(item.importedAt ? { importedAt: item.importedAt } : {}),
  ...(item.fileType ? { fileType: item.fileType } : {}),
  ...(item.contentType ? { contentType: item.contentType } : {}),
  ...(item.category ? { category: item.category } : {}),
  ...(item.product ? { product: item.product } : {}),
  ...(item.bank ? { bank: item.bank } : {}),
  ...(item.subBank ? { subBank: item.subBank } : {}),
  ...(item.character ? { character: item.character } : {}),
  ...(isFavorite ? { favorites: true } : {})
})

const mapRecentType = (extension?: string): RecentFileEntry['type'] => {
  if (!extension) return 'sample'
  const normalized = extension.toLowerCase()
  if (normalized === 'kit') return 'kit'
  if (normalized === 'pattern') return 'pattern'
  if (normalized === 'preset') return 'preset'
  return 'sample'
}

const sortStorageKey = 'drumcomputer_sort_mode_v1'

const hasClientStorage = (): boolean => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return false
  if (typeof import.meta !== 'undefined' && 'client' in import.meta && !import.meta.client) return false
  return true
}

const loadSortMode = (): SortMode => {
  if (!hasClientStorage()) return 'relevance'
  try {
    const raw = localStorage.getItem(sortStorageKey)
    if (!raw) return 'relevance'
    const value = raw as SortMode
    if (['name-asc', 'name-desc', 'date-asc', 'date-desc', 'relevance'].includes(value)) {
      return value
    }
  } catch {
    // ignore
  }
  return 'relevance'
}

const persistSortMode = (mode: SortMode) => {
  if (!hasClientStorage()) return
  try {
    localStorage.setItem(sortStorageKey, mode)
  } catch {
    // ignore
  }
}

const sortLabel = (mode: SortMode): string => {
  switch (mode) {
    case 'name-asc':
      return 'Name ↑'
    case 'name-desc':
      return 'Name ↓'
    case 'date-asc':
      return 'Date ↑'
    case 'date-desc':
      return 'Date ↓'
    default:
      return 'Relevance'
  }
}

const emptyPreviewState: PreviewState = {
  isPlaying: false,
  currentFile: null,
  progress: 0,
  duration: 0
}

export const useBrowserStore = defineStore('browser', {
  state: () => ({
    mode: 'LIBRARY' as BrowserMode,
    library: {
      query: '',
      results: [],
      rawResults: [],
      selectedId: null
    } as LibraryState,
    files: {
      currentPath: '/',
      entries: emptyListing,
      rawEntries: emptyListing,
      selectedPath: null
    } as FilesState,
    filters: createInitialFilters() as BrowserFilters,
    availableCategories: [] as string[],
    availableProducts: [] as string[],
    availableBanks: [] as string[],
    recentEntries: [] as RecentFileEntry[],
    sortMode: loadSortMode(),
    preview: null as ReturnType<typeof useSamplePreview> | null
  }),
  getters: {
    recentFiles(state): RecentFileEntry[] {
      return state.recentEntries
    },
    previewState(state): PreviewState {
      return state.preview?.state ?? emptyPreviewState
    }
  },
  actions: {
    ensurePreview() {
      if (!this.preview) {
        this.preview = markRaw(useSamplePreview())
      }
      return this.preview
    },
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
      const favorites = await repo.getFavorites()
      const favoriteIds = new Set(favorites.map((item) => item.id))
      const results =
        this.filters.favorites === true ? favorites : await repo.search(this.library.query ?? '', this.filters)
      const mapped = results.map((item) => mapLibraryItemToResult(item, favoriteIds.has(item.id)))
      this.availableCategories = uniqueNonEmpty(mapped.map((item) => item.category))
      this.availableProducts = uniqueNonEmpty(mapped.map((item) => item.product))
      this.availableBanks = uniqueNonEmpty(mapped.map((item) => item.bank))
      const filtered = mapped.filter((item) => matchesFilters(item, this.filters))
      this.library.rawResults = filtered
      this.library.results = filtered
      if (this.library.selectedId && !filtered.find((entry) => entry.id === this.library.selectedId)) {
        this.library.selectedId = null
      }
      this.sortResults()
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
      const fields: EncoderField[] = [
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
      if (this.mode === 'FILES') {
        fields.push({
          id: 'sort',
          label: 'Sort',
          value: sortLabel(this.sortMode),
          options: ['Name ↑', 'Name ↓', 'Date ↑', 'Date ↓']
        })
      }
      return fields
    },
    async selectResult(id: string | null) {
      this.library.selectedId = id
    },
    loadRecentFiles() {
      const recent = useRecentFiles()
      const entries = recent.getRecent()
      this.recentEntries = entries
      const mapped = entries.map((entry) => ({
        id: entry.id,
        title: entry.name,
        subtitle: entry.path,
        path: entry.path,
        timestamp: entry.timestamp
      }))
      this.library.rawResults = mapped
      this.library.results = mapped
      this.sortResults()
    },
    async addTag(tag: string) {
      if (!this.library.selectedId) return
      const repo = getLibraryRepository()
      await repo.addTag(this.library.selectedId, tag)
      await this.search()
    },
    async toggleFavorite(itemId: string) {
      const repo = getLibraryRepository()
      const isFavorite = await repo.isFavorite(itemId)
      if (isFavorite) {
        await repo.removeFromFavorites(itemId)
      } else {
        await repo.addToFavorites(itemId)
      }
      await this.search()
    },
    setSortMode(mode: SortMode) {
      this.sortMode = mode
      persistSortMode(mode)
      this.sortResults()
    },
    sortResults() {
      const mode = this.sortMode
      if (mode === 'relevance') {
        this.library.results = [...this.library.rawResults]
        this.files.entries = {
          dirs: [...this.files.rawEntries.dirs],
          files: [...this.files.rawEntries.files]
        }
        return
      }
      const nameSort = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: 'base' })
      const dateValue = (value?: number) => (typeof value === 'number' ? value : 0)
      const sortedResults = [...this.library.rawResults].sort((a, b) => {
        if (mode === 'name-asc') return nameSort(a.title, b.title)
        if (mode === 'name-desc') return nameSort(b.title, a.title)
        const dateA = dateValue(a.importedAt ?? a.timestamp)
        const dateB = dateValue(b.importedAt ?? b.timestamp)
        return mode === 'date-asc' ? dateA - dateB : dateB - dateA
      })
      const sortedDirs = [...this.files.rawEntries.dirs].sort((a, b) => {
        if (mode === 'name-asc') return nameSort(a.name, b.name)
        if (mode === 'name-desc') return nameSort(b.name, a.name)
        return 0
      })
      const sortedFiles = [...this.files.rawEntries.files].sort((a, b) => {
        if (mode === 'name-asc') return nameSort(a.name, b.name)
        if (mode === 'name-desc') return nameSort(b.name, a.name)
        return 0
      })
      if (mode === 'date-asc' || mode === 'date-desc') {
        const fallback = mode === 'date-asc' ? 1 : -1
        sortedDirs.sort((a, b) => nameSort(a.name, b.name) * fallback)
        sortedFiles.sort((a, b) => nameSort(a.name, b.name) * fallback)
      }
      this.library.results = sortedResults
      this.files.entries = { dirs: sortedDirs, files: sortedFiles }
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
      this.files.rawEntries = this.files.entries
      if (this.files.selectedPath && !this.files.entries.files.find((file) => file.path === this.files.selectedPath)) {
        this.files.selectedPath = null
      }
      this.sortResults()
    },
    selectPath(path: string | null) {
      this.files.selectedPath = path
    },
    async importSelected() {
      if (!this.files.selectedPath) return
      const fileRepo = getFileSystemRepository()
      const recent = useRecentFiles()
      const repo = getLibraryRepository()
      const meta = await fileRepo.readFileMeta(this.files.selectedPath)
      await repo.importFile(this.files.selectedPath, { name: meta.name })
      recent.addRecent({
        id: this.files.selectedPath,
        path: this.files.selectedPath,
        name: meta.name,
        type: mapRecentType(meta.extension)
      })
      this.loadRecentFiles()
      await repo.refreshIndex()
      await this.search()
    },
    async prehearSelected() {
      const preview = this.ensurePreview()
      const fileRepo = getFileSystemRepository()
      if (this.mode === 'FILES') {
        if (!this.files.selectedPath) return
        const blob = await fileRepo.readFileBlob?.(this.files.selectedPath)
        await preview.loadAndPlay(this.files.selectedPath, blob)
        return
      }
      if (this.library.selectedId) {
        const selected = this.library.results.find((item) => item.id === this.library.selectedId)
        if (!selected?.path) return
        const blob = await fileRepo.readFileBlob?.(selected.path)
        await preview.loadAndPlay(selected.path, blob)
      }
    },
    stopPrehear() {
      this.preview?.stop()
    },
    toDisplayModels(): { leftModel: DisplayPanelModel; rightModel: DisplayPanelModel } {
      const sortSummary = this.sortMode === 'relevance' ? '' : `Sorted by ${sortLabel(this.sortMode)}`
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
            summary: [sortSummary || null, 'Select a file to import'].filter(Boolean).join(' • '),
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
        const subtitle = result.subtitle
        const decoratedSubtitle = result.favorites ? `${subtitle ? `${subtitle} ` : ''}★` : subtitle
        const entry: DisplayListItem = {
          title: result.title,
          active: result.id === this.library.selectedId,
          value: result.id
        }
        if (decoratedSubtitle) {
          entry.subtitle = decoratedSubtitle
        }
        return entry
      })
      const leftSummary = [this.library.query || 'All', describeFilters(this.filters), sortSummary || null]
        .filter(Boolean)
        .join(' • ')
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
