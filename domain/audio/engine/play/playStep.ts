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

  // sample-accurate
  source.start(atTime)
}
