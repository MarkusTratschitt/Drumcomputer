import { velocityToGain } from '../../domain/velocity/velocityToGain'

export function createTransportAudioHooks(
  ctx: AudioContext,
  getStepNotes: (stepIndex: number) => Array<{
    buffer: AudioBuffer
    velocity: number
  }>
) {
  return {
    onStep(stepIndex: number, audioTime: number): void {
      const notes = getStepNotes(stepIndex)

      for (const note of notes) {
        const gainValue = velocityToGain(note.velocity)

        const source = ctx.createBufferSource()
        const gain = ctx.createGain()

        gain.gain.value = gainValue

        source.buffer = note.buffer
        source.connect(gain).connect(ctx.destination)
        source.start(audioTime)
      }
    }
  }
}
