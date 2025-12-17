import { ref } from 'vue'
import type { Pattern } from '~/types/drums'
import type { Soundbank, SampleRef } from '~/types/audio'

const DB_NAME = 'drum-machine-db'
const DB_VERSION = 2

interface StoredSampleRecord {
  id: string
  name: string
  format?: string
  blob: Blob
}

interface StoredPatternRecord {
  id: string
  bankId: string
  pattern: Pattern
}

export function useSoundbankStorage() {
  const dbRef = ref<IDBDatabase | null>(null)

  const open = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains('soundbanks')) {
          db.createObjectStore('soundbanks', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('samples')) {
          db.createObjectStore('samples', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('patterns')) {
          const store = db.createObjectStore('patterns', { keyPath: 'id' })
          store.createIndex('bankId', 'bankId', { unique: false })
        }
      }
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        dbRef.value = request.result
        resolve(request.result)
      }
    })
  }

  const ensureDb = async () => {
    if (dbRef.value) return dbRef.value
    return open()
  }

  const saveBank = async (bank: Soundbank) => {
    const db = await ensureDb()
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(['soundbanks'], 'readwrite')
      tx.objectStore('soundbanks').put(bank)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }

  const saveSample = async (sample: SampleRef & { blob: Blob }) => {
    const db = await ensureDb()
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(['samples'], 'readwrite')
      const record: StoredSampleRecord = { id: sample.id, name: sample.name, blob: sample.blob }
      if (sample.format) {
        record.format = sample.format
      }
      tx.objectStore('samples').put(record)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }

  const loadBanks = async (): Promise<Soundbank[]> => {
    const db = await ensureDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['soundbanks'], 'readonly')
      const request = tx.objectStore('soundbanks').getAll()
      request.onsuccess = () => resolve((request.result as Soundbank[]) ?? [])
      request.onerror = () => reject(request.error)
    })
  }

  const loadSample = async (sampleId: string): Promise<SampleRef | null> => {
    const db = await ensureDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['samples'], 'readonly')
      const request = tx.objectStore('samples').get(sampleId)
      request.onsuccess = () => {
        const result = request.result as StoredSampleRecord | undefined
        if (!result) {
          resolve(null)
          return
        }
        const restored: SampleRef = { id: result.id, name: result.name, blob: result.blob }
        const format = result.format as SampleRef['format'] | undefined
        if (format) {
          restored.format = format
        }
        resolve(restored)
      }
      request.onerror = () => reject(request.error)
    })
  }

  const savePatterns = async (bankId: string, patterns: Pattern[]) => {
    const db = await ensureDb()
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(['patterns'], 'readwrite')
      patterns.forEach((pattern) => {
        const record: StoredPatternRecord = { id: `${bankId}:${pattern.id}`, bankId, pattern }
        tx.objectStore('patterns').put(record)
      })
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  }

  const loadPatterns = async (bankId: string): Promise<Pattern[]> => {
    const db = await ensureDb()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['patterns'], 'readonly')
      const index = tx.objectStore('patterns').index('bankId')
      const request = index.getAll(bankId)
      request.onsuccess = () => {
        const records = (request.result as StoredPatternRecord[] | undefined) ?? []
        resolve(records.map((record) => record.pattern))
      }
      request.onerror = () => reject(request.error)
    })
  }

  return {
    saveBank,
    saveSample,
    loadBanks,
    loadSample,
    savePatterns,
    loadPatterns
  }
}
