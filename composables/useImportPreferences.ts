/**
 * Import Preferences Composable
 * Manages localStorage persistence for directory import settings
 */

export interface ImportPreferences {
  includeSubfolders: boolean
  defaultTags: string[]
  lastImportPath?: string
}

const STORAGE_KEY = 'drumcomputer-import-prefs-v1'

const DEFAULT_PREFERENCES: ImportPreferences = {
  includeSubfolders: true,
  defaultTags: []
}

export function useImportPreferences() {
  const load = (): ImportPreferences => {
    if (typeof window === 'undefined' || !window.localStorage) {
      return { ...DEFAULT_PREFERENCES }
    }
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (!stored) return { ...DEFAULT_PREFERENCES }
      const parsed = JSON.parse(stored)
      const result: ImportPreferences = {
        includeSubfolders: parsed.includeSubfolders ?? DEFAULT_PREFERENCES.includeSubfolders,
        defaultTags: Array.isArray(parsed.defaultTags) ? parsed.defaultTags : DEFAULT_PREFERENCES.defaultTags
      }
      if (parsed.lastImportPath) {
        result.lastImportPath = parsed.lastImportPath
      }
      return result
    } catch {
      return { ...DEFAULT_PREFERENCES }
    }
  }

  const save = (prefs: Partial<ImportPreferences>): void => {
    if (typeof window === 'undefined' || !window.localStorage) return
    try {
      const current = load()
      const updated = { ...current, ...prefs }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch (err) {
      console.warn('Failed to save import preferences:', err)
    }
  }

  const clear = (): void => {
    if (typeof window === 'undefined' || !window.localStorage) return
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch (err) {
      console.warn('Failed to clear import preferences:', err)
    }
  }

  return {
    load,
    save,
    clear
  }
}
