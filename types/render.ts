import type { DrumPadId } from './drums'
import type { GridSpec } from './time'

export interface RenderMetadata {
  seed: string
  bpm: number
  gridSpec: GridSpec
  sceneId: string | null
  patternChain: string[]
  initialPatternId: string
  durationSec: number
}

export interface RenderEvent {
  time: number
  padId: DrumPadId
  velocity: number
}
