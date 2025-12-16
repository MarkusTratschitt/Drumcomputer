import type { DrumPadId } from './drums'

export interface MidiDeviceInfo {
  id: string
  name: string
  type: 'input' | 'output'
}

export type MidiMessageType = 'noteon' | 'noteoff' | 'clock' | 'start' | 'stop' | 'continue' | 'cc'

export interface MidiMessage {
  type: MidiMessageType
  channel?: number
  note?: number
  velocity?: number
  controller?: number
  value?: number
}

export interface MidiMapping {
  noteMap: Partial<Record<number, DrumPadId>>
}

export interface MidiFileEvent {
  deltaTime: number
  message: MidiMessage
}

export interface MidiTrack {
  name: string
  events: MidiFileEvent[]
}

export interface MidiFileData {
  header: {
    ticksPerBeat: number
  }
  tracks: MidiTrack[]
}
