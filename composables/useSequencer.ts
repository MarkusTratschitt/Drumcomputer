import { ref, type Ref } from 'vue'
import { quantizeToStep } from '@/domain/quantize'
import { normalizeGridSpec, secondsPerStep } from '@/domain/timing'
import type { DrumPadId, Pattern } from '@/types/drums'
import type { SampleRef, Soundbank } from '@/types/audio'
import type { GridSpec, StepAddress } from '@/types/time'
import { useTransportStore } from '@/stores/transport'
import { useScheduler, type ScheduledTask } from './useScheduler'
import { useAudioEngine } from './useAudioEngine.client'
import { clampVelocity, cycleVelocity, DEFAULT_STEP_VELOCITY } from '@/domain/velocity'
import { createRenderClock, type RenderClock } from '@/domain/clock/renderClock'

interface SequencerOptions {
  getPattern: () => Pattern
  lookahead?: number
  scheduleAheadSec?: number
  onPatternBoundary?: () => Pattern | void
}

interface SchedulerLike {
  schedule: (task: ScheduledTask) => void
}

export interface ScheduledStep {
  when: number
  stepAddress: StepAddress
}

const totalStepsForGrid = (gridSpec: GridSpec) => gridSpec.bars * gridSpec.division

export interface ScheduleStepOptions {
  clock: RenderClock
  scheduler: SchedulerLike
  audio: ReturnType<typeof useAudioEngine>
  transport: ReturnType<typeof useTransportStore>
  getPattern: () => Pattern
  currentStep: Ref<number>
  pendingSteps: Ref<ScheduledStep[]>
  onPatternBoundary?: () => Pattern | void
}

export function scheduleStep(options: ScheduleStepOptions, when: number) {
  const pattern = options.getPattern()
  const totalSteps = totalStepsForGrid(pattern.gridSpec)
  const stepIndex = options.currentStep.value % totalSteps
  const barIndex = Math.floor(stepIndex / pattern.gridSpec.division)
  const stepInBar = stepIndex % pattern.gridSpec.division
  const scheduledWhen = Math.max(when, options.clock.now())
  options.pendingSteps.value.push({ when: scheduledWhen, stepAddress: { barIndex, stepInBar } })

  options.scheduler.schedule({
    when: scheduledWhen,
    callback: () => {
      const bar = pattern.steps[barIndex]
      const stepRow = bar?.[stepInBar]
      if (stepRow) {
        Object.entries(stepRow).forEach(([padId, cell]) => {
          options.audio.trigger({
            padId: padId as DrumPadId,
            when: scheduledWhen,
            velocity: cell?.velocity?.value ?? 1
          })
        })
      }

      options.currentStep.value = (options.currentStep.value + 1) % totalSteps
      options.transport.setCurrentStep(options.currentStep.value)
      const isPatternBoundary = options.currentStep.value === 0
      let nextPattern = pattern
      if (isPatternBoundary && options.onPatternBoundary) {
        const candidate = options.onPatternBoundary()
        if (candidate) {
          nextPattern = candidate
          options.transport.setGridSpec(nextPattern.gridSpec)
        } else {
          nextPattern = options.getPattern()
        }
      }

      if (options.transport.loop) {
        const stepDuration = secondsPerStep(options.transport.bpm, nextPattern.gridSpec.division)
        scheduleStep(options, scheduledWhen + stepDuration)
      }
    }
  })
}

export function useSequencer(options: SequencerOptions) {
  const transport = useTransportStore()
  const audio = useAudioEngine()
  let renderClock: RenderClock | null = null
  const scheduler = useScheduler({
    lookahead: options.lookahead ?? 25,
    scheduleAheadSec: options.scheduleAheadSec ?? 0.1,
    getTime: () => renderClock?.now() ?? 0
  })

  const currentStep = ref(0)
  const isRecording = ref(false)
  const pendingSteps = ref<ScheduledStep[]>([])
  let loopStartTime = 0

  const boundaryCallback = options.onPatternBoundary ?? (() => undefined)
  const buildStepOptions = (clock: RenderClock): ScheduleStepOptions => ({
    clock,
    scheduler,
    audio,
    transport,
    getPattern: options.getPattern,
    currentStep,
    pendingSteps,
    onPatternBoundary: boundaryCallback
  })

  const start = async () => {
    if (transport.isPlaying) return
    const ctx = await audio.resumeContext()
    renderClock = createRenderClock(ctx)
    const pattern = options.getPattern()
    const gridSpec = normalizeGridSpec(pattern.gridSpec)
    pattern.gridSpec = gridSpec
    transport.setGridSpec(gridSpec)
    loopStartTime = renderClock.now()
    currentStep.value = 0
    pendingSteps.value = []
    transport.setCurrentStep(0)
    transport.setPlaying(true)
    scheduler.clear()
    const stepOptions = buildStepOptions(renderClock)
    scheduleStep(stepOptions, loopStartTime)
    scheduler.start()
    scheduler.tick()
  }

  const stop = () => {
    transport.setPlaying(false)
    scheduler.stop()
    scheduler.clear()
    pendingSteps.value = []
    currentStep.value = 0
    transport.setCurrentStep(0)
    loopStartTime = 0
    renderClock = null
  }

  const toggleStep = (barIndex: number, stepInBar: number, padId: DrumPadId) => {
    const pattern = options.getPattern()
    const bar = pattern.steps[barIndex] ?? {}
    const stepRow = bar[stepInBar] ?? {}
    const updated = { ...stepRow }
    const nextVelocity = cycleVelocity(updated[padId]?.velocity?.value)
    if (nextVelocity === null) {
      delete updated[padId]
    } else {
      updated[padId] = { velocity: { value: clampVelocity(nextVelocity) } }
    }
    pattern.steps[barIndex] = { ...bar, [stepInBar]: updated }
  }

  const setStepVelocity = (barIndex: number, stepInBar: number, padId: DrumPadId, velocity: number) => {
    const pattern = options.getPattern()
    const bar = pattern.steps[barIndex] ?? {}
    const stepRow = bar[stepInBar] ?? {}
    const updated = { ...stepRow, [padId]: { velocity: { value: clampVelocity(velocity || DEFAULT_STEP_VELOCITY) } } }
    pattern.steps[barIndex] = { ...bar, [stepInBar]: updated }
  }

  const recordHit = async (padId: DrumPadId, velocity = 1, quantize = true) => {
    const pattern = options.getPattern()
    const ctx = await audio.resumeContext()
    const gridSpec = pattern.gridSpec
    const stepDuration = secondsPerStep(transport.bpm, gridSpec.division)
    const resolvedVelocity = clampVelocity(velocity)
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
    setStepVelocity(step.barIndex, step.stepInBar, padId, resolvedVelocity)
    audio.trigger({ padId, when: ctx.currentTime, velocity: resolvedVelocity })
  }

  const setSampleForPad = async (padId: DrumPadId, sample: SampleRef) => {
    await audio.setSampleForPad(padId, sample)
  }

  const applySoundbank = async (bank: Soundbank) => {
    await audio.applySoundbank(bank)
  }

  const getAudioTime = () => renderClock?.now() ?? audio.ensureContext().currentTime

  return {
    currentStep,
    isRecording,
    pendingSteps,
    start,
    stop,
    toggleStep,
    setStepVelocity,
    recordHit,
    fxSettings: audio.fxSettings,
    setFx: audio.setFx,
    setSampleForPad,
    applySoundbank,
    getAudioTime
  }
}
