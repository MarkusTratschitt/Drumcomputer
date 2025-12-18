import { describe, it, beforeEach } from 'mocha'
import { expect } from 'chai'
import { createTransportEngine } from '../domain/transport/transportEngine'
import type { RenderClock } from '../domain/clock/renderClock'
import type { Scheduler, ScheduledFn } from '../domain/clock/scheduler'
import type { TransportAudioHooks } from '../domain/transport/audioHooks'
import type { TransportConfig, TransportState } from '../domain/transport/types'

type ScheduledCall = { at: number, fn: ScheduledFn }

const createTestClock = (initialTime = 0): { clock: RenderClock, setTime: (next: number) => void } => {
  let now = initialTime
  const clock: RenderClock = {
    ctx: {} as BaseAudioContext,
    isOffline: false,
    audioTime: () => now
  }

  return {
    clock,
    setTime: (next: number) => {
      now = next
    }
  }
}

const createStubScheduler = (): {
  scheduler: Scheduler,
  calls: ScheduledCall[],
  counts: () => { start: number, stop: number, clear: number }
} => {
  const calls: ScheduledCall[] = []
  let start = 0
  let stop = 0
  let clear = 0

  const scheduler: Scheduler = {
    start(): void {
      start += 1
    },
    stop(): void {
      stop += 1
    },
    schedule(atTimeSec: number, fn: ScheduledFn): void {
      calls.push({ at: atTimeSec, fn })
    },
    clear(): void {
      clear += 1
      calls.length = 0
    }
  }

  return {
    scheduler,
    calls,
    counts: () => ({ start, stop, clear })
  }
}

describe('transportEngine', () => {
  const baseConfig: TransportConfig = {
    bpm: 120,
    gridSpec: { bars: 1, division: 4 }
  }

  let states: TransportState[]

  beforeEach(() => {
    states = []
  })

  it('starts playback, emits state and schedules the first boundary', () => {
    const { clock, setTime } = createTestClock(0)
    const schedulerStub = createStubScheduler()
    const engine = createTransportEngine(clock, schedulerStub.scheduler, baseConfig)

    const unsubscribe = engine.subscribe((state) => states.push(state))
    expect(states).to.deep.equal([{ isPlaying: false, currentStep: 0 }])

    engine.start()
    setTime(0.1)

    const lastState = states[states.length - 1]
    expect(lastState).to.deep.equal({ isPlaying: true, currentStep: 0 })
    const counts = schedulerStub.counts()
    expect(counts.start).to.equal(1)
    expect(counts.clear).to.equal(1)
    expect(schedulerStub.calls).to.have.lengthOf(1)
    expect(schedulerStub.calls[0]!.at).to.be.closeTo(0.5, 0.0001)

    unsubscribe()
  })

  it('advances steps on tick and schedules subsequent boundaries', () => {
    const { clock, setTime } = createTestClock(0)
    const schedulerStub = createStubScheduler()
    const engine = createTransportEngine(clock, schedulerStub.scheduler, baseConfig)
    engine.subscribe((state) => states.push(state))

    engine.start()
    setTime(0.51)
    engine.tick()

    const lastState = states[states.length - 1]
    expect(lastState).to.deep.equal({ isPlaying: true, currentStep: 1 })
    expect(schedulerStub.calls).to.have.lengthOf(2)
    expect(schedulerStub.calls[1]!.at).to.be.closeTo(1, 0.0001)
  })

  it('stops playback, clears scheduler, and ignores further ticks', () => {
    const { clock } = createTestClock(0)
    const schedulerStub = createStubScheduler()
    const engine = createTransportEngine(clock, schedulerStub.scheduler, baseConfig)
    engine.subscribe((state) => states.push(state))

    engine.start()
    schedulerStub.calls.length = 0

    engine.stop()
    const counts = schedulerStub.counts()
    expect(counts.stop).to.equal(1)
    expect(counts.clear).to.equal(2)
    const lastState = states[states.length - 1]
    expect(lastState).to.deep.equal({ isPlaying: false, currentStep: 3 })

    engine.tick()
    expect(schedulerStub.calls).to.have.lengthOf(0)
  })

  it('keeps phase stable when the config changes during playback', () => {
    const { clock, setTime } = createTestClock(0)
    const schedulerStub = createStubScheduler()
    const engine = createTransportEngine(clock, schedulerStub.scheduler, baseConfig)
    engine.subscribe((state) => states.push(state))

    engine.start()
    setTime(0.51)
    engine.tick()
    const lastStateAfterConfig = states[states.length - 1]
    expect(lastStateAfterConfig).to.deep.equal({ isPlaying: true, currentStep: 1 })

    const newConfig: TransportConfig = {
      bpm: 120,
      gridSpec: { bars: 1, division: 8 }
    }
    engine.setConfig(newConfig)

    const stableState = states[states.length - 1]
    expect(stableState).to.deep.equal({ isPlaying: true, currentStep: 1 })

    setTime(0.76)
    engine.tick()

    const progressedState = states[states.length - 1]
    expect(progressedState).to.deep.equal({ isPlaying: true, currentStep: 2 })
    expect(schedulerStub.calls).to.have.lengthOf(3)
    expect(schedulerStub.calls[2]!.at).to.be.closeTo(1.01, 0.0001)
  })

  it('applies swing offset to off-beat scheduling and forwards onStep callbacks', () => {
    const { clock } = createTestClock(0)
    const schedulerStub = createStubScheduler()
    const hookCalls: Array<{ stepIndex: number, audioTime: number }> = []
    const audioHooks: TransportAudioHooks = {
      onStep: (stepIndex, audioTime) => {
        hookCalls.push({ stepIndex, audioTime })
      }
    }

    const configWithSwing: TransportConfig = {
      bpm: 120,
      gridSpec: { bars: 1, division: 4 },
      swing: 0.5
    }

    const engine = createTransportEngine(clock, schedulerStub.scheduler, configWithSwing, audioHooks)
    engine.subscribe((state) => states.push(state))
    engine.start()

    expect(schedulerStub.calls[0]!.at).to.be.closeTo(0.625, 0.0001)

    schedulerStub.calls[0]!.fn(schedulerStub.calls[0]!.at)
    expect(hookCalls).to.deep.equal([{ stepIndex: 1, audioTime: schedulerStub.calls[0]!.at }])
  })
})
