/**
 * IndexedDB-based sample database for performant search and metadata storage.
 * Schema:
 * - samples: { path (key), name, tags[], lastUsedAtMs, importedAt, ...metadata }
 * - tokens: { token, path } for full-text search via tokenization
 */

export interface SampleDbEntry {
  path: string // Primary key
  name: string
  tags: string[]
  lastUsedAtMs?: number
  importedAt?: number
  fileType?: string
  contentType?: string
  category?: string
  product?: string
  bank?: string
  subBank?: string
  character?: string
  vendor?: 'factory' | 'user'
  favorites?: boolean
}

interface TokenEntry {
  token: string
  path: string
}

const DB_NAME = 'drumcomputer-samples'
const DB_VERSION = 1
const SAMPLES_STORE = 'samples'
const TOKENS_STORE = 'tokens'

let dbInstance: IDBDatabase | null = null
let dbPromise: Promise<IDBDatabase> | null = null

/**
 * Open IndexedDB connection with schema initialization.
 * Creates 'samples' and 'tokens' object stores with appropriate indices.
 */
export async function openDb(): Promise<IDBDatabase> {
  if (dbInstance) return dbInstance
  if (dbPromise) return dbPromise

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      dbInstance = request.result
      resolve(dbInstance)
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result

      // Samples store: path is primary key
      if (!db.objectStoreNames.contains(SAMPLES_STORE)) {
        const samplesStore = db.createObjectStore(SAMPLES_STORE, { keyPath: 'path' })
        samplesStore.createIndex('lastUsedAtMs', 'lastUsedAtMs', { unique: false })
        samplesStore.createIndex('importedAt', 'importedAt', { unique: false })
        samplesStore.createIndex('tags', 'tags', { unique: false, multiEntry: true })
      }

      // Tokens store: compound index for token-based search
      if (!db.objectStoreNames.contains(TOKENS_STORE)) {
        const tokensStore = db.createObjectStore(TOKENS_STORE, { autoIncrement: true })
        tokensStore.createIndex('token', 'token', { unique: false })
        tokensStore.createIndex('path', 'path', { unique: false })
        tokensStore.createIndex('token_path', ['token', 'path'], { unique: true })
      }
    }
  })

  return dbPromise
}

/**
 * Tokenize string into searchable tokens (lowercase, split by non-alphanumeric).
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 0)
}

/**
 * Upsert sample entry and update token index atomically.
 */
export async function upsertFromPath(entry: SampleDbEntry): Promise<void> {
  const db = await openDb()
  const tx = db.transaction([SAMPLES_STORE, TOKENS_STORE], 'readwrite')
  const samplesStore = tx.objectStore(SAMPLES_STORE)
  const tokensStore = tx.objectStore(TOKENS_STORE)

  // Write sample entry
  samplesStore.put(entry)

  // Delete old tokens for this path using cursor
  const pathIndex = tokensStore.index('path')
  const cursorRequest = pathIndex.openCursor(IDBKeyRange.only(entry.path))

  await new Promise<void>((resolve, reject) => {
    const keysToDelete: IDBValidKey[] = []

    cursorRequest.onsuccess = () => {
      const cursor = cursorRequest.result
      if (cursor) {
        keysToDelete.push(cursor.primaryKey)
        cursor.continue()
      } else {
        // Delete collected keys
        keysToDelete.forEach((key) => tokensStore.delete(key))

        // Write new tokens
        const tokens = new Set<string>()
        tokenize(entry.name).forEach((t) => tokens.add(t))
        tokenize(entry.path).forEach((t) => tokens.add(t))
        entry.tags.forEach((tag) => tokenize(tag).forEach((t) => tokens.add(t)))

        tokens.forEach((token) => {
          tokensStore.put({ token, path: entry.path } as TokenEntry)
        })

        resolve()
      }
    }
    cursorRequest.onerror = () => reject(cursorRequest.error)
  })

  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/**
 * Get sample entry by path.
 */
export async function getByPath(path: string): Promise<SampleDbEntry | null> {
  const db = await openDb()
  const tx = db.transaction(SAMPLES_STORE, 'readonly')
  const store = tx.objectStore(SAMPLES_STORE)
  const request = store.get(path)

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result ?? null)
    request.onerror = () => reject(request.error)
  })
}

/**
 * Search samples by query string using token index.
 * Returns samples where any token matches query tokens.
 */
export async function search(query: string): Promise<SampleDbEntry[]> {
  const db = await openDb()
  const queryTokens = tokenize(query)

  if (queryTokens.length === 0) {
    // Empty query: return all samples sorted by lastUsedAtMs
    return getRecent()
  }

  const tx = db.transaction([TOKENS_STORE, SAMPLES_STORE], 'readonly')
  const tokensStore = tx.objectStore(TOKENS_STORE)
  const samplesStore = tx.objectStore(SAMPLES_STORE)
  const tokenIndex = tokensStore.index('token')

  const matchingPaths = new Set<string>()

  // Find all paths matching any query token
  for (const token of queryTokens) {
    const range = IDBKeyRange.bound(token, token + '\uffff', false, true)
    const request = tokenIndex.getAll(range)

    await new Promise<void>((resolve, reject) => {
      request.onsuccess = () => {
        const results = request.result as TokenEntry[]
        results.forEach((entry) => matchingPaths.add(entry.path))
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }

  // Fetch all matching samples
  const results: SampleDbEntry[] = []
  for (const path of matchingPaths) {
    const request = samplesStore.get(path)
    const entry = await new Promise<SampleDbEntry | null>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result ?? null)
      request.onerror = () => reject(request.error)
    })
    if (entry) results.push(entry)
  }

  return results
}

/**
 * Update tags for an existing sample.
 */
export async function setTags(path: string, tags: string[]): Promise<void> {
  const existing = await getByPath(path)
  if (!existing) throw new Error(`Sample not found: ${path}`)

  existing.tags = tags
  await upsertFromPath(existing)
}

/**
 * Get recent samples sorted by lastUsedAtMs descending.
 */
export async function getRecent(limit?: number): Promise<SampleDbEntry[]> {
  const db = await openDb()
  const tx = db.transaction(SAMPLES_STORE, 'readonly')
  const store = tx.objectStore(SAMPLES_STORE)
  const index = store.index('lastUsedAtMs')
  const request = index.openCursor(null, 'prev')

  const results: SampleDbEntry[] = []

  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      const cursor = request.result
      if (cursor && (!limit || results.length < limit)) {
        results.push(cursor.value as SampleDbEntry)
        cursor.continue()
      } else {
        resolve(results)
      }
    }
    request.onerror = () => reject(request.error)
  })
}

/**
 * Get all samples (for migration or full export).
 */
export async function getAllSamples(): Promise<SampleDbEntry[]> {
  const db = await openDb()
  const tx = db.transaction(SAMPLES_STORE, 'readonly')
  const store = tx.objectStore(SAMPLES_STORE)
  const request = store.getAll()

  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result as SampleDbEntry[])
    request.onerror = () => reject(request.error)
  })
}

/**
 * Clear all data (for testing).
 */
export async function clearAll(): Promise<void> {
  const db = await openDb()
  const tx = db.transaction([SAMPLES_STORE, TOKENS_STORE], 'readwrite')
  tx.objectStore(SAMPLES_STORE).clear()
  tx.objectStore(TOKENS_STORE).clear()

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/**
 * Close DB connection (for cleanup).
 */
export function closeDb(): void {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
    dbPromise = null
  }
}

/**
 * Migrate samples from localStorage libraryRepository to IndexedDB.
 * Called once on first init; sets flag 'sampleDb:migrated' to prevent re-migration.
 */
export async function migrateFromLocalStorage(): Promise<void> {
  if (typeof localStorage === 'undefined') return

  const migrated = localStorage.getItem('sampleDb:migrated')
  if (migrated === 'true') return // Already migrated

  try {
    const raw = localStorage.getItem('library:v2')
    if (!raw) {
      localStorage.setItem('sampleDb:migrated', 'true')
      return
    }

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      localStorage.setItem('sampleDb:migrated', 'true')
      return
    }

    // Migrate each item to IndexedDB
    for (const item of parsed) {
      if (item.path) {
        const entry: SampleDbEntry = {
          path: item.path,
          name: item.name ?? item.path.split('/').pop() ?? item.path,
          tags: Array.isArray(item.tags) ? item.tags : [],
          lastUsedAtMs: item.lastUsedAtMs,
          importedAt: item.importedAt,
          fileType: item.fileType,
          contentType: item.contentType,
          category: item.category,
          product: item.product,
          bank: item.bank,
          subBank: item.subBank,
          character: item.character,
          vendor: item.vendor,
          favorites: item.favorites
        }
        await upsertFromPath(entry)
      }
    }

    localStorage.setItem('sampleDb:migrated', 'true')
  } catch (error) {
    console.error('Migration from localStorage failed:', error)
    // Don't set migrated flag on error to retry next time
  }
}

// Test utilities
export function __resetSampleDb(): void {
  closeDb()
}
