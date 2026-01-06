export type BrowserMode = 'LIBRARY' | 'FILES'

export type BrowserResultItem = {
  id: string
  title: string
  subtitle?: string
  path?: string
  tags?: string[]
  fileType?: string
  contentType?: string
  category?: string
  product?: string
  bank?: string
  subBank?: string
  character?: string
  favorites?: boolean
}

export type BrowserFileEntry = {
  name: string
  path: string
}
