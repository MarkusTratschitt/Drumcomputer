export type TimeDivision = 1 | 2 | 4 | 8 | 16 | 32 | 64

export interface TimeSignature {
  numerator: 4
  denominator: 4
}

export interface GridSpec {
  bars: 1 | 2 | 4 | 8
  division: TimeDivision
}

export interface StepAddress {
  barIndex: number
  stepInBar: number
}
