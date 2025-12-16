import type { DrumPadId } from './drums'

export type AudioFormat = 'wav' | 'mp3' | 'ogg' | 'aac' | 'flac'

export interface SampleRef {
  id: string
  name: string
  url?: string
  buffer?: AudioBuffer
  format?: AudioFormat
  blob?: Blob
}

export interface Soundbank {
  id: string
  name: string
  pads: Partial<Record<DrumPadId, SampleRef>>
  createdAt: number
  updatedAt: number
}

export interface AudioRouting {
  masterGain: number
}

export interface FxSettings {
  filter: {
    enabled: boolean
    frequency: number
    q: number
  }
  drive: {
    enabled: boolean
    amount: number
  }
  reverb: {
    enabled: boolean
    mix: number
  }
}
