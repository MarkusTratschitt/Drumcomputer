import { ref } from 'vue'
import { quantizeToStep } from '~/domain/quantize'
import { secondsPerStep } from '~/domain/timing'
import type { DrumPadId, Pattern } from '~/types/drums'
import type { SampleRef, Soundbank } from '~/types/audio'
import type { GridSpec, StepAddress } from '~/types/time'
import { useTransportStore } from '~/stores/transport'
import { useScheduler } from './useScheduler'
import { useAudioEngine } from './useAudioEngine.client'

interface SequencerOptions {
  getPattern: () => Pattern
  lookahead?: number
  scheduleAheadSec?: number
}

interface ScheduledStep {
  when: number
  stepAddress: StepAddress
}

export function useSequencer(options: SequencerOptions) {
  const transport = useTransportStore()
  const audio = useAudioEngine()
  const scheduler = useScheduler({
    lookahead: options.lookahead ?? 25,
    scheduleAheadSec: options.scheduleAheadSec ?? 0.1,
    getTime: () => audio.ensureContext().currentTime
  })

  const currentStep = ref(0)
  const isRecording = ref(false)
  const pendingSteps = ref<ScheduledStep[]>([])
  let loopStartTime = 0

  const totalStepsForGrid = (gridSpec: GridSpec) => gridSpec.bars * gridSpec.division

  const scheduleStep = (when: number) => {
    const pattern = options.getPattern()
    const totalSteps = totalStepsForGrid(pattern.gridSpec)
    const stepIndex = currentStep.value % totalSteps
    const barIndex = Math.floor(stepIndex / pattern.gridSpec.division)
    const stepInBar = stepIndex % pattern.gridSpec.division
    pendingSteps.value.push({ when, stepAddress: { barIndex, stepInBar } })
    scheduler.schedule({
      when,
      callback: () => {
        playStep(pattern, when, { barIndex, stepInBar })
        currentStep.value = (currentStep.value + 1) % totalSteps
        transport.setCurrentStep(currentStep.value)
        if (transport.loop) {
          const stepDuration = secondsPerStep(transport.bpm, pattern.gridSpec.division)
          scheduleStep(when + stepDuration)
        }
      }
    })
  }

  const playStep = (pattern: Pattern, when: number, step: StepAddress) => {
    const bar = pattern.steps[step.barIndex]
    const stepRow = bar?.[step.stepInBar]
    if (!stepRow) return
    Object.entries(stepRow).forEach(([padId, cell]) => {
      audio.trigger({ padId: padId as DrumPadId, when, velocity: cell?.velocity?.value ?? 1 })
    })
  }

  const start = () => {
    const ctx = audio.ensureContext()
    const pattern = options.getPattern()
    transport.setGridSpec(pattern.gridSpec)
    loopStartTime = ctx.currentTime
    currentStep.value = 0
    transport.setCurrentStep(0)
    transport.setPlaying(true)
    scheduler.clear()
    scheduleStep(loopStartTime)
    scheduler.start()
    scheduler.tick()
  }

  const stop = () => {
    transport.setPlaying(false)
    scheduler.stop()
    scheduler.clear()
    pendingSteps.value = []
  }

  const toggleStep = (barIndex: number, stepInBar: number, padId: DrumPadId) => {
    const pattern = options.getPattern()
    const bar = pattern.steps[barIndex] ?? {}
    const stepRow = bar[stepInBar] ?? {}
    const updated = { ...stepRow }
    if (updated[padId]) {
      delete updated[padId]
    } else {
      updated[padId] = { velocity: { value: 1 } }
    }
    pattern.steps[barIndex] = { ...bar, [stepInBar]: updated }
  }

  const recordHit = (padId: DrumPadId, velocity = 1, quantize = true) => {
    const pattern = options.getPattern()
    const ctx = audio.ensureContext()
    const gridSpec = pattern.gridSpec
    const stepDuration = secondsPerStep(transport.bpm, gridSpec.division)
    const anchor = transport.isPlaying ? loopStartTime : ctx.currentTime
    if (!transport.isPlaying) {
      loopStartTime = anchor
    }
    const sinceStart = ctx.currentTime - anchor
    const step = quantize
      ? quantizeToStep(sinceStart, stepDuration, gridSpec.bars, gridSpec.division)
      : {
          barIndex: Math.floor(currentStep.value / gridSpec.division),
          stepInBar: currentStep.value % gridSpec.division
        }
    toggleStep(step.barIndex, step.stepInBar, padId)
    audio.trigger({ padId, when: ctx.currentTime, velocity })
  }

  const setSampleForPad = async (padId: DrumPadId, sample: SampleRef) => {
    await audio.setSampleForPad(padId, sample)
  }

  const applySoundbank = async (bank: Soundbank) => {
    await audio.applySoundbank(bank)
  }

  return {
    currentStep,
    isRecording,
    pendingSteps,
    start,
    stop,
    toggleStep,
    recordHit,
    setSampleForPad,
    applySoundbank
  }
}
