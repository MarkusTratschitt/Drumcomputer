import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  getFileSystemRepository,
  __resetFileSystemRepository,
  type DirectoryListing
} from '../../services/fileSystemRepository'

type MockFileNode = {
  name: string
  kind: 'file'
  content: string
}

type MockDirNode = {
  name: string
  kind: 'directory'
  children: Array<MockFileNode | MockDirNode>
}

const createFileHandle = (node: MockFileNode): FileSystemFileHandle => {
  return {
    kind: 'file',
    name: node.name,
    async getFile() {
      return new File([node.content], node.name, { type: 'text/plain' })
    }
  } as FileSystemFileHandle
}

const createDirHandle = (node: MockDirNode): FileSystemDirectoryHandle => {
  const entries = async function* () {
    for (const child of node.children) {
      if (child.kind === 'directory') {
        yield [child.name, createDirHandle(child)] as [string, FileSystemHandle]
      } else {
        yield [child.name, createFileHandle(child)] as [string, FileSystemHandle]
      }
    }
  }
  const getDirectoryHandle = async (name: string) => {
    const match = node.children.find((child) => child.kind === 'directory' && child.name === name)
    if (!match || match.kind !== 'directory') {
      throw new Error('Directory not found')
    }
    return createDirHandle(match)
  }
  const getFileHandle = async (name: string) => {
    const match = node.children.find((child) => child.kind === 'file' && child.name === name)
    if (!match || match.kind !== 'file') {
      throw new Error('File not found')
    }
    return createFileHandle(match)
  }
  return {
    kind: 'directory',
    name: node.name,
    entries,
    getDirectoryHandle,
    getFileHandle
  } as unknown as FileSystemDirectoryHandle
}

describe('file system repository', () => {
  const originalWindow = globalThis.window
  const originalPicker = (globalThis.window as Window | undefined)?.showDirectoryPicker

  beforeEach(() => {
    __resetFileSystemRepository()
  })

  afterEach(() => {
    if (originalWindow) {
      if (originalPicker) {
        originalWindow.showDirectoryPicker = originalPicker
      } else if ('showDirectoryPicker' in originalWindow) {
        delete originalWindow.showDirectoryPicker
      }
      globalThis.window = originalWindow
    } else {
      // @ts-expect-error: cleanup for test-only window injection
      delete globalThis.window
    }
    __resetFileSystemRepository()
  })

  it('lists directories and files via browser file system access', async () => {
    const root: MockDirNode = {
      name: 'root',
      kind: 'directory',
      children: [
        {
          name: 'Samples',
          kind: 'directory',
          children: [{ name: 'kick.wav', kind: 'file', content: 'kick' }]
        },
        { name: 'root.wav', kind: 'file', content: 'root' }
      ]
    }
    const picker = vi.fn(async () => createDirHandle(root))
    globalThis.window = { showDirectoryPicker: picker } as unknown as Window & typeof globalThis

    const repo = getFileSystemRepository()
    const listing: DirectoryListing = await repo.listDir('/')

    expect(picker).toHaveBeenCalledTimes(1)
    expect(listing.dirs.map((dir) => dir.name)).toContain('Samples')
    expect(listing.files.map((file) => file.name)).toContain('root.wav')
  })

  it('reads a blob from the browser file system access handle', async () => {
    const root: MockDirNode = {
      name: 'root',
      kind: 'directory',
      children: [{ name: 'clip.txt', kind: 'file', content: 'clip' }]
    }
    const picker = vi.fn(async () => createDirHandle(root))
    globalThis.window = { showDirectoryPicker: picker } as unknown as Window & typeof globalThis

    const repo = getFileSystemRepository()
    const blob = await repo.readFileBlob?.('/clip.txt')

    expect(blob).toBeInstanceOf(Blob)
    expect(blob?.size).toBe(4)
  })

  it('falls back to the in-memory file system when the API is unavailable', async () => {
    if (globalThis.window) {
      delete globalThis.window.showDirectoryPicker
    }

    const repo = getFileSystemRepository()
    const listing = await repo.listDir('/')

    expect(listing.dirs.length).toBeGreaterThan(0)
    expect(listing.files.length).toBeGreaterThanOrEqual(0)
  })
})
