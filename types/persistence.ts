import type { Pattern, Scene } from './drums'
import type { Soundbank, SampleRef } from './audio'
import type { MidiMapping } from './midi'

export interface PersistedState {
  patterns: Pattern[]
  scenes: Scene[]
  soundbanks: Soundbank[]
  samples: SampleRef[]
  mappings: MidiMapping[]
}
