import { onBeforeUnmount, ref } from 'vue'
import { useScheduler } from './useScheduler'
import type { ClockAuthority, SyncMode, SyncRole, SyncState } from '@/types/sync'
import type { MidiMessage } from '@/types/midi'

interface SyncDeps {
  midi?: {
    listen: (cb: (message: MidiMessage) => void) => () => void
    sendClockTick: () => void
    sendStart: () => void
    sendStop: () => void
    selectedOutputId: { value: string | null }
  }
  getAudioTime?: () => number
  onExternalStart?: () => void
  onExternalStop?: () => void
}

const MIDI_CLOCKS_PER_QUARTER = 24
const CLOCK_AUTHORITY: ClockAuthority = 'audioContext'

export function useSync(initialMode: SyncMode = 'internal', deps?: SyncDeps) {
  // Coordinates transport sync between audio clock and MIDI clock roles (master/slave), handling clock ticks and start/stop events.
  const state = ref<SyncState>({
    bpm: 120,
    phase: 0,
    isPlaying: false,
    mode: initialMode,
    role: 'master',
    linkAvailable: false,
    clockAuthority: CLOCK_AUTHORITY,
    bpmSource: 'transport'
  })
  const scheduler = deps?.getAudioTime
    ? useScheduler({
      lookahead: 25,
      scheduleAheadSec: 0.05,
      getTime: deps.getAudioTime
    })
    : null
  const lastStableBpm = ref(state.value.bpm)
  let nextClockAt: number | null = null
  let midiUnsubscribe: (() => void) | null = null

  const secondsPerClockTick = () => 60 / (state.value.bpm * MIDI_CLOCKS_PER_QUARTER)

  const resetPhase = () => {
    state.value.phase = 0
  }

  const stopClock = () => {
    scheduler?.stop()
    scheduler?.clear()
    nextClockAt = null
    deps?.midi?.sendStop()
  }

  const tick = () => {
    state.value.phase = (state.value.phase + 1) % MIDI_CLOCKS_PER_QUARTER
  }

  const scheduleClockTick = () => {
    if (!scheduler || nextClockAt === null) return
    scheduler.schedule({
      when: nextClockAt,
      callback: () => {
        deps?.midi?.sendClockTick()
        tick()
        if (nextClockAt !== null) {
          nextClockAt = nextClockAt + secondsPerClockTick()
          scheduleClockTick()
        }
      }
    })
  }

  const startClock = () => {
    stopClock()
    if (state.value.mode !== 'midiClock' || state.value.role !== 'master') return
    if (!deps?.midi?.selectedOutputId.value) return
    if (!deps?.getAudioTime || !scheduler) return
    const now = deps.getAudioTime()
    nextClockAt = now + secondsPerClockTick()
    deps.midi.sendStart()
    scheduleClockTick()
    scheduler.start()
    scheduler.tick()
  }

  const setMode = (mode: SyncMode) => {
    state.value.mode = mode
    state.value.bpm = lastStableBpm.value
    stopClock()
    if (state.value.isPlaying && state.value.mode === 'midiClock' && state.value.role === 'master') {
      startClock()
    }
  }

  const setRole = (role: SyncRole) => {
    state.value.role = role
    state.value.bpm = lastStableBpm.value
    stopClock()
    if (state.value.isPlaying && state.value.mode === 'midiClock' && state.value.role === 'master') {
      startClock()
    }
  }

  const setPlaying = (isPlaying: boolean) => {
    state.value.isPlaying = isPlaying
    if (isPlaying) {
      startClock()
    } else {
      stopClock()
    }
  }

  const setBpm = (bpm: number) => {
    state.value.bpm = Math.max(20, Math.min(300, bpm))
    lastStableBpm.value = state.value.bpm
    if (state.value.isPlaying && state.value.mode === 'midiClock' && state.value.role === 'master') {
      startClock()
    }
  }

  const handleMidiMessage = (message: MidiMessage) => {
    if (state.value.mode !== 'midiClock' || state.value.role !== 'slave') return
    if (message.type === 'start') {
      state.value.isPlaying = true
      resetPhase()
      deps?.onExternalStart?.()
    } else if (message.type === 'stop') {
      state.value.isPlaying = false
      resetPhase()
      deps?.onExternalStop?.()
    } else if (message.type === 'clock') {
      tick()
    }
  }

  const startTransport = (bpm: number) => {
    setBpm(bpm)
    setPlaying(true)
  }

  const stopTransport = () => {
    setPlaying(false)
  }

  if (deps?.midi) {
    midiUnsubscribe = deps.midi.listen(handleMidiMessage)
  }

  onBeforeUnmount(() => {
    stopClock()
    midiUnsubscribe?.()
  })

  return {
    state,
    setMode,
    setRole,
    setPlaying,
    setBpm,
    startTransport,
    stopTransport
  }
}
