export function velocityToGain(
  velocity: number,
  minGain = 0.15
): number {
  // velocity expected in [0, 1]
  const v = Math.max(0, Math.min(1, velocity))

  // psychoacoustic-friendly curve
  const curved = v * v

  return minGain + (1 - minGain) * curved
}
