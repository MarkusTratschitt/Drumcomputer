import type { DrumPadId } from '@/types/drums'
// Update the import path below to the correct relative path where GridSpec is defined
import type { GridSpec } from '@/types/time'
// Or adjust the path as needed based on your project structure

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
