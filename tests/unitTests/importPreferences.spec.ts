import { describe, it, expect, beforeEach } from 'vitest'
import { useImportPreferences } from '../../composables/useImportPreferences'

describe('useImportPreferences', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear()
    }
  })

  it('loads default preferences when no stored data', () => {
    const { load } = useImportPreferences()
    const prefs = load()
    expect(prefs.includeSubfolders).toBe(true)
    expect(prefs.defaultTags).toEqual([])
    expect(prefs.lastImportPath).toBeUndefined()
  })

  it('saves and loads preferences', () => {
    const { save, load } = useImportPreferences()
    save({
      includeSubfolders: false,
      defaultTags: ['drums', 'kit'],
      lastImportPath: '/samples/drums'
    })
    const loaded = load()
    expect(loaded.includeSubfolders).toBe(false)
    expect(loaded.defaultTags).toEqual(['drums', 'kit'])
    expect(loaded.lastImportPath).toBe('/samples/drums')
  })

  it('merges partial updates', () => {
    const { save, load } = useImportPreferences()
    save({ includeSubfolders: false })
    save({ defaultTags: ['test'] })
    const loaded = load()
    expect(loaded.includeSubfolders).toBe(false)
    expect(loaded.defaultTags).toEqual(['test'])
  })

  it('clears preferences', () => {
    const { save, load, clear } = useImportPreferences()
    save({ defaultTags: ['test'] })
    clear()
    const loaded = load()
    expect(loaded.defaultTags).toEqual([])
  })
})
