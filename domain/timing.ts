import type { GridSpec } from '~/types/time'

export function secondsPerStep(bpm: number, division: number): number {
  return (60 / bpm) * (4 / division)
}

export function stepsPerBar(gridSpec: GridSpec): number {
  return gridSpec.division
}
