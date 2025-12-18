import type { StepGrid, DrumPadId } from '../../types/drums'
import type { GridSpec } from '../../types/time'

export interface StepNote {
  buffer: AudioBuffer
  velocity: number
}

export function createStepNoteResolver(
  steps: StepGrid,
  gridSpec: GridSpec,
  buffersByPad: Record<DrumPadId, AudioBuffer>
): (stepIndex: number) => StepNote[] {
  return (stepIndex: number): StepNote[] => {
    const result: StepNote[] = []

    const barIndex = Math.floor(stepIndex / gridSpec.division)
    const stepInBar = stepIndex % gridSpec.division

    const step = steps[barIndex]?.[stepInBar]
    if (!step) {
      return result
    }

    ; (Object.entries(step) as [DrumPadId, { velocity: { value: number } }][])
      .forEach(([padId, note]) => {
        const buffer = buffersByPad[padId]
        if (!buffer) {
          return
        }

        result.push({
          buffer,
          velocity: note.velocity.value
        })
      })

    return result
  }
}
