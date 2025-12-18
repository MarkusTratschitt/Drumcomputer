// Update the import path if the file is located elsewhere, for example:
import { velocityToGain } from '../../velocity/velocityToGain'
// Or create the file '../velocity/velocityToGain.ts' if it does not exist.

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
