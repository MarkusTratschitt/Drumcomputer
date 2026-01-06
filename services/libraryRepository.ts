import { getFileSystemRepository } from './fileSystemRepository'

export type LibraryItem = {
  id: string
  name: string
  path?: string
  tags: string[]
  importedAt?: number
  fileType?: string
  contentType?: string
  category?: string
  product?: string
  bank?: string
  subBank?: string
  character?: string
  vendor?: string
  favorites?: boolean
}

export type LibrarySearchFilters = Record<string, string | string[] | boolean | undefined>

export interface ImportProgress {
  total: number
  completed: number
  current: string
  errors: string[]
}

export interface LibraryRepository {
  search(query: string, filters?: LibrarySearchFilters): Promise<LibraryItem[]>
  getItem(id: string): Promise<LibraryItem | undefined>
  getTags(itemId: string): Promise<string[]>
  addTag(itemId: string, tag: string): Promise<string[]>
  removeTag(itemId: string, tag: string): Promise<string[]>
  importFile(path: string, meta?: Partial<LibraryItem>): Promise<LibraryItem>
  addToFavorites(itemId: string): Promise<void>
  removeFromFavorites(itemId: string): Promise<void>
  getFavorites(): Promise<LibraryItem[]>
  isFavorite(itemId: string): Promise<boolean>
  refreshIndex(): Promise<void>
  importDirectory?(
    path: string,
    options?: { recursive?: boolean },
    onProgress?: (progress: ImportProgress) => void
  ): Promise<void>
}

const STORAGE_KEY = 'drumcomputer_library_items_v1'
const FAVORITES_KEY = 'drumcomputer_favorites_v1'

const normalizeTag = (value: string): string => value.trim().toLowerCase()
const supportedExtensions = new Set(['wav', 'wave', 'mp3', 'aiff', 'aif', 'flac', 'ogg'])

const getExtension = (path: string): string => {
  const name = path.split('/').pop() ?? ''
  const parts = name.split('.')
  if (parts.length < 2) return ''
  return (parts.pop() ?? '').toLowerCase()
}

const extractMetadataFromPath = (path: string): Partial<LibraryItem> => {
  const parts = path.split('/').filter(Boolean)
  return {
    category: parts[0],
    product: parts[1],
    bank: parts[2],
    subBank: parts[3],
    vendor: 'user'
  }
}

const createLocalRepository = (): LibraryRepository => {
  let items: LibraryItem[] = loadPersisted()
  let favorites = loadFavorites()

  function persist() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
      }
    } catch {
      // ignore persistence errors in non-browser environments
    }
  }

  function loadPersisted(): LibraryItem[] {
    try {
      if (typeof localStorage === 'undefined') return []
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed.map((entry) => ({
          ...entry,
          tags: Array.isArray(entry?.tags) ? entry.tags.map(String) : []
        }))
      }
    } catch {
      // ignore
    }
    return []
  }

  function persistFavorites() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(favorites)))
      }
    } catch {
      // ignore
    }
  }

  function loadFavorites(): Set<string> {
    try {
      if (typeof localStorage === 'undefined') return new Set()
      const raw = localStorage.getItem(FAVORITES_KEY)
      if (!raw) return new Set()
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return new Set(parsed.map(String))
      }
    } catch {
      // ignore
    }
    return new Set()
  }

  return {
    async search(query: string, _filters?: LibrarySearchFilters): Promise<LibraryItem[]> {
      const text = query.trim().toLowerCase()
      if (!text) return [...items]
      return items.filter((item) => {
        const haystack = `${item.name} ${item.tags.join(' ')}`.toLowerCase()
        return haystack.includes(text)
      })
    },
    async getItem(id: string) {
      return items.find((item) => item.id === id)
    },
    async getTags(itemId: string) {
      return (await this.getItem(itemId))?.tags ?? []
    },
    async addTag(itemId: string, tag: string) {
      const normalized = normalizeTag(tag)
      items = items.map((item) => {
        if (item.id !== itemId) return item
        const tags = new Set(item.tags.map(normalizeTag))
        tags.add(normalized)
        return { ...item, tags: Array.from(tags) }
      })
      persist()
      return (await this.getTags(itemId)) ?? []
    },
    async removeTag(itemId: string, tag: string) {
      const normalized = normalizeTag(tag)
      items = items.map((item) => {
        if (item.id !== itemId) return item
        return { ...item, tags: item.tags.filter((value) => normalizeTag(value) !== normalized) }
      })
      persist()
      return (await this.getTags(itemId)) ?? []
    },
    async importFile(path: string, meta?: Partial<LibraryItem>) {
      const id = meta?.id ?? path
      const existing = items.find((item) => item.id === id)
      const name = meta?.name ?? path.split('/').pop() ?? 'Sample'
      const next: LibraryItem = {
        id,
        name,
        path,
        tags: existing?.tags ?? [],
        importedAt: Date.now(),
        ...meta
      }
      if (existing) {
        items = items.map((item) => (item.id === id ? next : item))
      } else {
        items = [...items, next]
      }
      persist()
      return next
    },
    async addToFavorites(itemId: string) {
      favorites.add(itemId)
      persistFavorites()
    },
    async removeFromFavorites(itemId: string) {
      favorites.delete(itemId)
      persistFavorites()
    },
    async getFavorites() {
      return items.filter((item) => favorites.has(item.id))
    },
    async isFavorite(itemId: string) {
      return favorites.has(itemId)
    },
    async refreshIndex() {
      items = loadPersisted()
      favorites = loadFavorites()
    },
    async importDirectory(path: string, options, onProgress) {
      const repo = getFileSystemRepository()
      const recursive = options?.recursive ?? false
      const errors: string[] = []
      const filesToImport: string[] = []

      const collectFiles = async (dirPath: string) => {
        try {
          const listing = await repo.listDir(dirPath)
          for (const file of listing.files) {
            const extension = getExtension(file.path)
            if (!supportedExtensions.has(extension)) {
              errors.push(file.path)
              continue
            }
            filesToImport.push(file.path)
          }
          if (recursive) {
            for (const dir of listing.dirs) {
              await collectFiles(dir.path)
            }
          }
        } catch {
          errors.push(dirPath)
        }
      }

      await collectFiles(path)

      const total = filesToImport.length
      let completed = 0
      for (const filePath of filesToImport) {
        try {
          const meta = extractMetadataFromPath(filePath)
          await this.importFile(filePath, meta)
        } catch {
          errors.push(filePath)
        }
        completed += 1
        onProgress?.({ total, completed, current: filePath, errors: [...errors] })
      }

      if (errors.length > 0) {
        console.warn('Import completed with errors', errors)
      }
    }
  }
}

let repository: LibraryRepository = createLocalRepository()

export const getLibraryRepository = (): LibraryRepository => repository

export const __setLibraryRepositoryForTests = (repo: LibraryRepository) => {
  repository = repo
}

export const __resetLibraryRepository = () => {
  repository = createLocalRepository()
}
