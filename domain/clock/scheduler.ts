import type { RenderClock } from './renderClock'

export type ScheduledFn = () => void

export interface SchedulerOptions {
  readonly lookaheadSec: number
  readonly intervalMs: number
}

export interface Scheduler {
  start(): void
  stop(): void
  schedule(atTimeSec: number, fn: ScheduledFn): void
  clear(): void
}

interface ScheduledItem {
  at: number
  fn: ScheduledFn
}

const DEFAULT_OPTIONS: SchedulerOptions = {
  lookaheadSec: 0.1,
  intervalMs: 25
}

export function createScheduler(clock: RenderClock, options: Partial<SchedulerOptions> = {}): Scheduler {
  const cfg: SchedulerOptions = { ...DEFAULT_OPTIONS, ...options }

  let timerId: ReturnType<typeof setInterval> | null = null
  let queue: ScheduledItem[] = []

  const flush = (): void => {
    const now = clock.audioTime()
    const horizon = now + cfg.lookaheadSec

    // Keep queue sorted to guarantee deterministic execution order
    queue.sort((a, b) => a.at - b.at)

    const due: ScheduledItem[] = []
    const pending: ScheduledItem[] = []

    for (const item of queue) {
      if (item.at <= horizon) {
        due.push(item)
      } else {
        pending.push(item)
      }
    }

    queue = pending

    // Execute all due items in order
    for (const item of due) {
      item.fn()
    }
  }

  return {
    start(): void {
      if (clock.isOffline) {
        // Offline rendering should call flush manually from the renderer/engine
        return
      }
      if (timerId) {
        return
      }
      timerId = setInterval(flush, cfg.intervalMs)
    },

    stop(): void {
      if (!timerId) {
        return
      }
      clearInterval(timerId)
      timerId = null
    },

    schedule(atTimeSec: number, fn: ScheduledFn): void {
      queue.push({ at: atTimeSec, fn })
    },

    clear(): void {
      queue = []
    }
  }
}
