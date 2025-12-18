import type { GridSpec, TimeDivision } from '@/types/time'

export const GRID_DIVISIONS: readonly TimeDivision[] = [1, 2, 4, 8, 16, 32, 64] as const
export const DEFAULT_GRID_SPEC: GridSpec = { bars: 1, division: 16 }

export function secondsPerStep(bpm: number, division: number): number {
  return (60 / bpm) * (4 / division)
}

export function stepsPerBar(gridSpec: GridSpec): number {
  return gridSpec.division
}

export function normalizeGridSpec(gridSpec?: Partial<GridSpec>): GridSpec {
  const division = GRID_DIVISIONS.includes((gridSpec?.division ?? DEFAULT_GRID_SPEC.division) as TimeDivision)
    ? (gridSpec?.division as TimeDivision)
    : DEFAULT_GRID_SPEC.division
  const bars: GridSpec['bars'] =
    gridSpec?.bars === 1 || gridSpec?.bars === 2 || gridSpec?.bars === 4 || gridSpec?.bars === 8
      ? gridSpec.bars
      : DEFAULT_GRID_SPEC.bars

  return { bars, division }
}
