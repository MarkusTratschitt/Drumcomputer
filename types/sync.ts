export type SyncMode = 'internal' | 'midiClock' | 'abletonLink'
export type SyncRole = 'master' | 'slave'

export interface SyncState {
  bpm: number
  phase: number
  isPlaying: boolean
  mode: SyncMode
  role: SyncRole
  linkAvailable?: boolean
}
