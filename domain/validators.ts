import type { GridSpec } from '~/types/time'

export function isValidGridSpec(gridSpec: GridSpec): boolean {
  return gridSpec.bars >= 1 && gridSpec.bars <= 8 && [1, 2, 4, 8, 16, 32, 64].includes(gridSpec.division)
}
