export type SyncMode = 'internal' | 'midiClock' | 'abletonLink'
export type SyncRole = 'master' | 'slave'
export type ClockAuthority = 'audioContext'
export type SyncBpmSource = 'transport'

export interface SyncState {
  bpm: number
  phase: number
  isPlaying: boolean
  mode: SyncMode
  role: SyncRole
  linkAvailable?: boolean
  clockAuthority: ClockAuthority
  bpmSource: SyncBpmSource
}
