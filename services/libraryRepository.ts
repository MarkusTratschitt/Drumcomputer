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
  favorites?: boolean
}

export type LibrarySearchFilters = Record<string, string | string[] | boolean | undefined>

export interface LibraryRepository {
  search(query: string, filters?: LibrarySearchFilters): Promise<LibraryItem[]>
  getItem(id: string): Promise<LibraryItem | undefined>
  getTags(itemId: string): Promise<string[]>
  addTag(itemId: string, tag: string): Promise<string[]>
  removeTag(itemId: string, tag: string): Promise<string[]>
  importFile(path: string, meta?: Partial<LibraryItem>): Promise<LibraryItem>
  refreshIndex(): Promise<void>
}

const STORAGE_KEY = 'drumcomputer_library_items_v1'

const normalizeTag = (value: string): string => value.trim().toLowerCase()

const createLocalRepository = (): LibraryRepository => {
  let items: LibraryItem[] = loadPersisted()

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
    async refreshIndex() {
      items = loadPersisted()
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
