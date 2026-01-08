export {}

declare global {
  interface Window {
    showDirectoryPicker?: (options?: unknown) => Promise<FileSystemDirectoryHandle>
  }
}
