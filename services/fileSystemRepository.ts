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
    async readFileMeta(path: string) {
      const name = path.split('/').pop() ?? path
      const parts = name.split('.')
      const extension = parts.length > 1 ? parts.pop() : undefined
      return { name, extension }
    }
  }
}

let repository: FileSystemRepository = createMemoryFs()

export const getFileSystemRepository = (): FileSystemRepository => repository

export const __setFileSystemRepositoryForTests = (repo: FileSystemRepository) => {
  repository = repo
}

export const __resetFileSystemRepository = () => {
  repository = createMemoryFs()
}
