import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as sampleDb from '../../services/sampleDb'

describe('SampleDB (IndexedDB)', () => {
  beforeEach(async () => {
    await sampleDb.clearAll()
  })

  afterEach(async () => {
    await sampleDb.clearAll()
    sampleDb.closeDb()
  })

  it('upsert enforces unique path (overwrites existing)', async () => {
    const entry1 = {
      path: '/samples/kick.wav',
      name: 'Kick 1',
      tags: ['drum', 'kick'],
      lastUsedAtMs: 1000,
      importedAt: 1000
    }

    const entry2 = {
      path: '/samples/kick.wav',
      name: 'Kick Updated',
      tags: ['drum', 'kick', 'updated'],
      lastUsedAtMs: 2000,
      importedAt: 1000
    }

    await sampleDb.upsertFromPath(entry1)
    await sampleDb.upsertFromPath(entry2)

    const result = await sampleDb.getByPath('/samples/kick.wav')
    expect(result).not.toBeNull()
    expect(result?.name).toBe('Kick Updated')
    expect(result?.tags).toEqual(['drum', 'kick', 'updated'])
    expect(result?.lastUsedAtMs).toBe(2000)

    const all = await sampleDb.getAllSamples()
    expect(all.length).toBe(1)
  })

  it('token search finds partial matches', async () => {
    await sampleDb.upsertFromPath({
      path: '/samples/snare-top.wav',
      name: 'Snare Top',
      tags: ['snare', 'drum'],
      lastUsedAtMs: 1000
    })

    await sampleDb.upsertFromPath({
      path: '/samples/snare-bottom.wav',
      name: 'Snare Bottom',
      tags: ['snare', 'drum'],
      lastUsedAtMs: 2000
    })

    await sampleDb.upsertFromPath({
      path: '/samples/kick.wav',
      name: 'Kick',
      tags: ['kick', 'drum'],
      lastUsedAtMs: 3000
    })

    // Search for "snare"
    const snareResults = await sampleDb.search('snare')
    expect(snareResults.length).toBe(2)
    expect(snareResults.every((r) => r.path.includes('snare'))).toBe(true)

    // Search for "drum"
    const drumResults = await sampleDb.search('drum')
    expect(drumResults.length).toBe(3)

    // Search for partial token "sna"
    const partialResults = await sampleDb.search('sna')
    expect(partialResults.length).toBe(2)

    // Search for non-existent token
    const noResults = await sampleDb.search('cymbal')
    expect(noResults.length).toBe(0)
  })

  it('getRecent sorts by lastUsedAtMs descending', async () => {
    await sampleDb.upsertFromPath({
      path: '/samples/a.wav',
      name: 'A',
      tags: [],
      lastUsedAtMs: 1000
    })

    await sampleDb.upsertFromPath({
      path: '/samples/b.wav',
      name: 'B',
      tags: [],
      lastUsedAtMs: 3000
    })

    await sampleDb.upsertFromPath({
      path: '/samples/c.wav',
      name: 'C',
      tags: [],
      lastUsedAtMs: 2000
    })

    const recent = await sampleDb.getRecent()
    expect(recent.length).toBe(3)
    expect(recent[0].path).toBe('/samples/b.wav')
    expect(recent[1].path).toBe('/samples/c.wav')
    expect(recent[2].path).toBe('/samples/a.wav')

    const recentLimited = await sampleDb.getRecent(2)
    expect(recentLimited.length).toBe(2)
    expect(recentLimited[0].path).toBe('/samples/b.wav')
    expect(recentLimited[1].path).toBe('/samples/c.wav')
  })

  it('setTags updates existing entry and re-indexes tokens', async () => {
    await sampleDb.upsertFromPath({
      path: '/samples/hat.wav',
      name: 'Hat',
      tags: ['hihat'],
      lastUsedAtMs: 1000
    })

    // Update tags
    await sampleDb.setTags('/samples/hat.wav', ['hihat', 'closed'])

    const updated = await sampleDb.getByPath('/samples/hat.wav')
    expect(updated?.tags).toEqual(['hihat', 'closed'])

    // Search should find by new tag
    const closedResults = await sampleDb.search('closed')
    expect(closedResults.length).toBe(1)
    expect(closedResults[0].path).toBe('/samples/hat.wav')
  })

  it('search with empty query returns all samples', async () => {
    await sampleDb.upsertFromPath({
      path: '/samples/a.wav',
      name: 'A',
      tags: [],
      lastUsedAtMs: 1000
    })

    await sampleDb.upsertFromPath({
      path: '/samples/b.wav',
      name: 'B',
      tags: [],
      lastUsedAtMs: 2000
    })

    const results = await sampleDb.search('')
    expect(results.length).toBe(2)
  })

  it('upsertFromPath tokenizes path, name, and tags', async () => {
    await sampleDb.upsertFromPath({
      path: '/user/samples/808-kick-deep.wav',
      name: '808 Kick Deep',
      tags: ['electronic', 'bass-drum'],
      lastUsedAtMs: 1000
    })

    // Search by path component
    const pathResults = await sampleDb.search('808')
    expect(pathResults.length).toBe(1)

    // Search by name token
    const nameResults = await sampleDb.search('deep')
    expect(nameResults.length).toBe(1)

    // Search by tag token
    const tagResults = await sampleDb.search('electronic')
    expect(tagResults.length).toBe(1)

    // Search by hyphenated tag
    const hyphenResults = await sampleDb.search('bass')
    expect(hyphenResults.length).toBe(1)
  })
})
