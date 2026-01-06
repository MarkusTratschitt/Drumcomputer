export type FileEntry = {
  name: string
  path: string
}

export type DirEntry = FileEntry

export type DirectoryListing = {
  dirs: DirEntry[]
  files: FileEntry[]
}

export interface FileSystemRepository {
  listDir(path: string): Promise<DirectoryListing>
  stat(path: string): Promise<{ isDir: boolean }>
  readFileMeta(path: string): Promise<{ name: string; extension?: string }>
  requestAccess?: () => Promise<boolean>
  readFileBlob?: (path: string) => Promise<Blob>
}

declare global {
  interface Window {
    showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>
  }
}

type FsNode = {
  name: string
  children?: FsNode[]
}

const defaultTree: FsNode = {
  name: '/',
  children: [
    {
      name: 'Samples',
      children: [
        { name: 'kick.wav' },
        { name: 'snare.wav' },
        { name: 'hat.wav' },
        { name: 'loops', children: [{ name: 'break1.wav' }] }
      ]
    },
    {
      name: 'Imports',
      children: [
        { name: 'vox.wav' },
        { name: 'bass.aiff' }
      ]
    }
  ]
}

const buildPath = (parent: string, child: string): string => {
  const normalizedParent = parent.endsWith('/') ? parent.slice(0, -1) : parent
  return `${normalizedParent}/${child}`.replace(/\/+/g, '/')
}

const normalizePath = (path: string): string => {
  const parts = path.split('/').filter(Boolean)
  return parts.length === 0 ? '/' : `/${parts.join('/')}`
}

const isDirectoryHandle = (handle: FileSystemHandle): handle is FileSystemDirectoryHandle =>
  handle.kind === 'directory'

const isFileHandle = (handle: FileSystemHandle): handle is FileSystemFileHandle => handle.kind === 'file'

const getDirectoryPicker = (): (() => Promise<FileSystemDirectoryHandle>) => {
  if (typeof window === 'undefined' || typeof window.showDirectoryPicker !== 'function') {
    throw new Error('File System Access API not supported')
  }
  return window.showDirectoryPicker
}

const hasFileSystemAccess = (): boolean => {
  if (typeof window === 'undefined') return false
  if (typeof import.meta !== 'undefined' && 'client' in import.meta && !import.meta.client) {
    return false
  }
  return typeof window.showDirectoryPicker === 'function'
}

class BrowserFileSystemRepository implements FileSystemRepository {
  private rootHandle: FileSystemDirectoryHandle | null = null
  private handleCache = new Map<string, FileSystemHandle>()

  async requestAccess(): Promise<boolean> {
    try {
      const picker = getDirectoryPicker()
      this.rootHandle = await picker()
      this.handleCache.clear()
      this.handleCache.set('/', this.rootHandle)
      return true
    } catch {
      return false
    }
  }

  private async resolveHandle(path: string): Promise<FileSystemHandle | null> {
    const normalized = normalizePath(path)
    const cached = this.handleCache.get(normalized)
    if (cached) return cached
    if (!this.rootHandle) return null
    const parts = normalized.split('/').filter(Boolean)
    let current: FileSystemDirectoryHandle | null = this.rootHandle
    let currentPath = '/'
    for (let index = 0; index < parts.length; index += 1) {
      const part = parts[index]
      if (!current) return null
      const nextPath = buildPath(currentPath, part)
      let nextHandle: FileSystemHandle | null = null
      try {
        nextHandle = await current.getDirectoryHandle(part)
      } catch {
        try {
          nextHandle = await current.getFileHandle(part)
        } catch {
          nextHandle = null
        }
      }
      if (!nextHandle) return null
      this.handleCache.set(nextPath, nextHandle)
      if (isDirectoryHandle(nextHandle)) {
        current = nextHandle
      } else {
        current = null
      }
      currentPath = nextPath
    }
    return this.handleCache.get(normalized) ?? null
  }

  private async resolveDirectoryHandle(path: string): Promise<FileSystemDirectoryHandle | null> {
    const handle = await this.resolveHandle(path)
    if (handle && isDirectoryHandle(handle)) return handle
    return null
  }

  private async resolveFileHandle(path: string): Promise<FileSystemFileHandle | null> {
    const handle = await this.resolveHandle(path)
    if (handle && isFileHandle(handle)) return handle
    return null
  }

  async listDir(path: string): Promise<DirectoryListing> {
    if (!this.rootHandle) {
      const granted = await this.requestAccess()
      if (!granted) return { dirs: [], files: [] }
    }
    const dirHandle = await this.resolveDirectoryHandle(path)
    if (!dirHandle) return { dirs: [], files: [] }
    const dirs: DirEntry[] = []
    const files: FileEntry[] = []
    for await (const [name, handle] of dirHandle.entries()) {
      const entryPath = buildPath(normalizePath(path), name)
      if (isDirectoryHandle(handle)) {
        dirs.push({ name, path: entryPath })
      } else if (isFileHandle(handle)) {
        files.push({ name, path: entryPath })
      }
      this.handleCache.set(entryPath, handle)
    }
    return { dirs, files }
  }

  async stat(path: string): Promise<{ isDir: boolean }> {
    if (!this.rootHandle) {
      const granted = await this.requestAccess()
      if (!granted) return { isDir: false }
    }
    const handle = await this.resolveHandle(path)
    return { isDir: handle?.kind === 'directory' }
  }

  async readFileMeta(path: string): Promise<{ name: string; extension?: string }> {
    const name = path.split('/').pop() ?? path
    const parts = name.split('.')
    const extension = parts.length > 1 ? parts.pop() : undefined
    const meta: { name: string; extension?: string } = { name }
    if (extension) {
      meta.extension = extension
    }
    return meta
  }

  async readFileBlob(path: string): Promise<Blob> {
    if (!this.rootHandle) {
      const granted = await this.requestAccess()
      if (!granted) return new Blob()
    }
    const handle = await this.resolveFileHandle(path)
    if (!handle) return new Blob()
    const file = await handle.getFile()
    return file
  }
}

const createMemoryFs = (root: FsNode = defaultTree): FileSystemRepository => {
  const findNode = (path: string): FsNode | null => {
    const parts = path.split('/').filter(Boolean)
    let cursor: FsNode | undefined = root
    if (parts.length === 0) return root
    for (const part of parts) {
      cursor = cursor?.children?.find((child) => child.name === part)
      if (!cursor) return null
    }
    return cursor ?? null
  }

  return {
    async listDir(path: string): Promise<DirectoryListing> {
      const node = findNode(path)
      if (!node || !node.children) {
        return { dirs: [], files: [] }
      }
      const dirs: DirEntry[] = []
      const files: FileEntry[] = []
      node.children.forEach((child) => {
        const entryPath = buildPath(path || '/', child.name)
        if (child.children) {
          dirs.push({ name: child.name, path: entryPath })
        } else {
          files.push({ name: child.name, path: entryPath })
        }
      })
      return { dirs, files }
    },
    async stat(path: string): Promise<{ isDir: boolean }> {
      const node = findNode(path)
      return { isDir: !!node?.children }
    },
    async readFileMeta(path: string): Promise<{ name: string; extension?: string }> {
      const name = path.split('/').pop() ?? path
      const parts = name.split('.')
      const extension = parts.length > 1 ? parts.pop() : undefined
      const meta: { name: string; extension?: string } = { name }
      if (extension) {
        meta.extension = extension
      }
      return meta
    }
  }
}

let repository: FileSystemRepository | null = null

export const getFileSystemRepository = (): FileSystemRepository => {
  if (repository) return repository
  if (hasFileSystemAccess()) {
    repository = new BrowserFileSystemRepository()
    return repository
  }
  repository = createMemoryFs()
  return repository
}

export const __setFileSystemRepositoryForTests = (repo: FileSystemRepository) => {
  repository = repo
}

export const __resetFileSystemRepository = () => {
  repository = null
}
