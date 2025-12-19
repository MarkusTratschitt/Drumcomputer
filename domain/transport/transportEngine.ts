import type { RenderClock } from '../clock/renderClock'
import type { Scheduler } from '../clock/scheduler'
import type { TransportConfig, TransportState } from './types'
import type { TransportAudioHooks } from './audioHooks'
export type TransportListener = (state: TransportState) => void

export interface TransportEngine {
  start(): void
  stop(): void
  setConfig(next: TransportConfig): void
  subscribe(listener: TransportListener): () => void
  tick(): void
}

const clampInt = (value: number): number => {
  if (!Number.isFinite(value)) {
    return 0
  }
  return Math.floor(value)
}



export function createTransportEngine(
  clock: RenderClock,
  scheduler: Scheduler,
  initial: TransportConfig,
  audioHooks?: TransportAudioHooks
  ): TransportEngine {
    let cfg: TransportConfig = initial

    let isPlaying = false
    let startTimeSec = 0
    let lastStep = -1
    let lastAbsoluteStep = -1

    const listeners = new Set<TransportListener>()
    const stepDurationSec = (): number => {
    const stepsPerBar = Math.max(1, cfg.gridSpec.division)
    const beatsPerBar = 4
    const beatsPerStep = beatsPerBar / stepsPerBar
    const secPerBeat = 60 / Math.max(1, cfg.bpm)
    return beatsPerStep * secPerBeat
    }
  
    const totalSteps = (): number => {
      const steps = cfg.gridSpec.bars * cfg.gridSpec.division
      return Math.max(0, clampInt(steps))
    }

    const normalizeStep = (step: number): number => {
      const steps = Math.max(totalSteps(), 1)
      return ((step % steps) + steps) % steps
    }

    const swingOffsetSec = (stepIndex: number): number => {
    const swing = cfg.swing ?? 0
    if (swing <= 0) {
      return 0
    }

    // apply swing to off-beats only
    const isOffBeat = stepIndex % 2 === 1
    if (!isOffBeat) {
      return 0
    }

    return stepDurationSec() * swing * 0.5
  }

  const emit = (): void => {
    const steps = Math.max(totalSteps(), 1)
    const normalized = ((lastStep % steps) + steps) % steps

    const state: TransportState = {
      isPlaying,
      currentStep: normalized
    }

    for (const listener of listeners) {
      listener(state)
      }
    }
    
    const computeAbsoluteStepAt = (timeSec: number): number => {
      const dur = stepDurationSec()
      const raw = (timeSec - startTimeSec) / dur
      return clampInt(raw)
    }

    let lastScheduledStep = -1

    const scheduleStepBoundary = (stepIndexAbsolute: number): void => {
      if (stepIndexAbsolute === lastScheduledStep) {
        return
      }

      const normalizedStep = normalizeStep(stepIndexAbsolute)
      lastScheduledStep = stepIndexAbsolute

      const stepTimeSec =
        startTimeSec +
        stepIndexAbsolute * stepDurationSec() +
        swingOffsetSec(normalizedStep)

      scheduler.schedule(stepTimeSec, (audioTime) => {
        audioHooks?.onStep(normalizedStep, audioTime)
      })
    }


    const advance = (): void => {
      const now = clock.audioTime()
      const currentAbsolute = computeAbsoluteStepAt(now)
      const current = normalizeStep(currentAbsolute)

      if (current !== lastStep) {
        lastStep = current
        lastAbsoluteStep = currentAbsolute
        scheduleStepBoundary(lastAbsoluteStep + 1)
        emit()
      }
    }

  return {
    start(): void {
      if (isPlaying) {
        return
      }
      isPlaying = true
      startTimeSec = clock.audioTime()
      lastStep = -1
      lastAbsoluteStep = -1
      lastScheduledStep = -1
      scheduler.clear()
      scheduler.start()
      lastAbsoluteStep = computeAbsoluteStepAt(startTimeSec)
      lastStep = normalizeStep(lastAbsoluteStep)
      emit()
      scheduleStepBoundary(lastAbsoluteStep + 1)
    },

    stop(): void {
      if (!isPlaying) {
        return
      }
      isPlaying = false
      scheduler.stop()
      scheduler.clear()
      lastStep = -1
      lastScheduledStep = -1
      emit()
    },

    setConfig(next: TransportConfig): void {
      cfg = next
      // Re-normalize immediately
      if (isPlaying) {
        // Keep phase consistent by resetting start time to "now - currentStep * dur"
        const now = clock.audioTime()
        const dur = stepDurationSec()
        const steps = Math.max(totalSteps(), 1)
        const current = ((lastStep % steps) + steps) % steps
        startTimeSec = now - lastAbsoluteStep * dur - swingOffsetSec(current)
        scheduler.clear()
        lastScheduledStep = -1
        lastAbsoluteStep = computeAbsoluteStepAt(now)
        lastStep = normalizeStep(lastAbsoluteStep)
        scheduleStepBoundary(lastAbsoluteStep + 1)
      } else {
        lastScheduledStep = -1
      }
      emit()
    },

    subscribe(listener: TransportListener): () => void {
      listeners.add(listener)
      // emit current snapshot immediately
      listener({
        isPlaying,
        currentStep: Math.max(0, lastStep)
      })
      return (): void => {
        listeners.delete(listener)
      }
    },

    tick(): void {
      if (!isPlaying) {
        return
      }
      advance()
    }
  }
}
