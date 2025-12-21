// Converts a normalized velocity value to a gain multiplier using a simple curve.
export function velocityToGain(
  velocity: number,
  minGain = 0.15
): number {
  const v = Math.max(0, Math.min(1, velocity))

  const curved = v * v

  return minGain + (1 - minGain) * curved
}
