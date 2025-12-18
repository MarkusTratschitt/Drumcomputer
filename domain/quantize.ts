import type { StepAddress } from '@/types/time'

export function quantizeToStep(time: number, secondsPerStep: number, bars: number, division: number): StepAddress {
  const totalSteps = bars * division
  const stepIndex = Math.max(0, Math.min(totalSteps - 1, Math.round(time / secondsPerStep)))
  return {
    barIndex: Math.floor(stepIndex / division),
    stepInBar: stepIndex % division
  }
}
