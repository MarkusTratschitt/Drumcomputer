// Plays an AudioBuffer at a scheduled AudioContext time with a fixed gain stage.
export function playStepAt(
  ctx: AudioContext,
  buffer: AudioBuffer,
  atTime: number,
  gainValue = 1
): void {
  const source = ctx.createBufferSource()
  const gain = ctx.createGain()

  gain.gain.value = gainValue

  source.buffer = buffer
  source.connect(gain).connect(ctx.destination)

  source.start(atTime)
}
