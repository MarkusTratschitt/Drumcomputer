export const STEP_VELOCITY_LEVELS = [0.7, 1, 1.25] as const
export const DEFAULT_STEP_VELOCITY = STEP_VELOCITY_LEVELS[0]
export const ACCENT_STEP_VELOCITY = STEP_VELOCITY_LEVELS[STEP_VELOCITY_LEVELS.length - 1]

const EPSILON = 0.001

const matchesLevel = (value: number, level: number) => Math.abs(value - level) < EPSILON

export function clampVelocity(value: number): number {
  const clamped = Math.max(STEP_VELOCITY_LEVELS[0], Math.min(ACCENT_STEP_VELOCITY, value))
  const closest = STEP_VELOCITY_LEVELS.find((level) => matchesLevel(clamped, level))
  return closest ?? clamped
}

export function cycleVelocity(current?: number): number | null {
  if (typeof current !== 'number') {
    return DEFAULT_STEP_VELOCITY
  }
  const index = STEP_VELOCITY_LEVELS.findIndex((level) => matchesLevel(current, level))
  if (index === -1) {
    return DEFAULT_STEP_VELOCITY
  }
  const nextIndex = index + 1
  if (nextIndex >= STEP_VELOCITY_LEVELS.length) {
    return null
  }
  return STEP_VELOCITY_LEVELS[nextIndex]
}

export function velocityToIntensity(value?: number): number {
  if (!value) return 0
  return Math.min(1, value / ACCENT_STEP_VELOCITY)
}
