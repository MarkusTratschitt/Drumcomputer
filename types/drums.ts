import type { GridSpec, StepAddress } from './time'

export type DrumPadId =
  | 'pad1'
  | 'pad2'
  | 'pad3'
  | 'pad4'
  | 'pad5'
  | 'pad6'
  | 'pad7'
  | 'pad8'
  | 'pad9'
  | 'pad10'
  | 'pad11'
  | 'pad12'
  | 'pad13'
  | 'pad14'
  | 'pad15'
  | 'pad16'

export interface Velocity {
  value: number
}

export interface StepCell {
  velocity?: Velocity
}

export type StepGrid = Record<number, Record<number, Partial<Record<DrumPadId, StepCell>>>>

export interface Pattern {
  id: string
  name: string
  gridSpec: GridSpec
  steps: StepGrid
}

export interface Scene {
  id: string
  name: string
  patternIds: string[]
}

export interface PadEvent {
  padId: DrumPadId
  time: number
  velocity: number
}

export interface QuantizedPadEvent extends PadEvent {
  step: StepAddress
}
