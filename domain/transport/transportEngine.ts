import type { RenderClock } from '../clock/renderClock'
import type { Scheduler } from '../clock/scheduler'
import type { TransportConfig, TransportState } from './types'

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
  initial: TransportConfig
): TransportEngine {
  let cfg: TransportConfig = initial

  let isPlaying = false
  let startTimeSec = 0
  let lastStep = -1

  const listeners = new Set<TransportListener>()

  const totalSteps = (): number => {
    const steps = cfg.gridSpec.bars * cfg.gridSpec.division
    return Math.max(0, clampInt(steps))
  }

  const stepDurationSec = (): number => {
    // 1 beat = quarter note
    // division = steps per bar? (your GridSpec: bars * division)
    // We'll interpret "division" as steps per bar, and bar is 4/4.
    // If your bar length differs, this is the single place to change it.
    const stepsPerBar = Math.max(1, cfg.gridSpec.division)
    const beatsPerBar = 4
    const beatsPerStep = beatsPerBar / stepsPerBar
    const secPerBeat = 60 / Math.max(1, cfg.bpm)
    return beatsPerStep * secPerBeat
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

  const computeStepAt = (timeSec: number): number => {
    const steps = Math.max(totalSteps(), 1)
    const dur = stepDurationSec()
    const raw = (timeSec - startTimeSec) / dur
    const step = clampInt(raw)
    return ((step % steps) + steps) % steps
  }

  const scheduleStepBoundary = (stepIndex: number): void => {
    // Hook point: schedule sample-accurate audio events for this step.
    // This stays domain-side; UI never schedules audio.
    // Example:
    // scheduler.schedule(atTime, () => audioEngine.playStep(stepIndex))
    void stepIndex
  }

  const advance = (): void => {
    const now = clock.audioTime()
    const current = computeStepAt(now)

    if (current !== lastStep) {
      lastStep = current
      scheduleStepBoundary(current)
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
      scheduler.start()
      emit()
    },

    stop(): void {
      if (!isPlaying) {
        return
      }
      isPlaying = false
      scheduler.stop()
      scheduler.clear()
      lastStep = -1
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
        startTimeSec = now - current * dur
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
