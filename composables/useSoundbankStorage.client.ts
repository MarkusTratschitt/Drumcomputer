import { ref } from 'vue'
import type { Soundbank, SampleRef } from '~/types/audio'

const DB_NAME = 'drum-machine-db'
const DB_VERSION = 1

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

  const saveSample = async (sample: SampleRef) => {
    const db = await ensureDb()
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(['samples'], 'readwrite')
      tx.objectStore('samples').put(sample)
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

  return {
    saveBank,
    saveSample,
    loadBanks
  }
}
