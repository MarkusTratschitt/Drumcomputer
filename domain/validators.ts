import { GRID_DIVISIONS } from './timing'
import type { GridSpec } from '~/types/time'

export function isValidGridSpec(gridSpec: GridSpec): boolean {
  return gridSpec.bars >= 1 && gridSpec.bars <= 8 && GRID_DIVISIONS.includes(gridSpec.division)
}
