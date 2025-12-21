import type { DrumPadId } from '@/types/drums'
import type { GridSpec } from '@/types/time'

// Shared transport domain types for playback and grid configuration.

export interface TransportState {
  readonly isPlaying: boolean
  readonly currentStep: number
}

export type StepTogglePayload = {
  barIndex: number
  stepInBar: number
  padId: DrumPadId
}

export interface TransportConfig {
  readonly bpm: number
  readonly gridSpec: GridSpec
  swing?: number
}
