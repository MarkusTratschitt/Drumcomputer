export type BrowserMode = 'LIBRARY' | 'FILES'

export type BrowserResultItem = {
  id: string
  title: string
  subtitle?: string
  path?: string
  tags?: string[]
}

export type BrowserFileEntry = {
  name: string
  path: string
}
