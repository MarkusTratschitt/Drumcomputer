import { onBeforeUnmount, ref } from 'vue'
import type { SyncMode, SyncRole, SyncState } from '~/types/sync'
import type { MidiMessage } from '~/types/midi'

interface SyncDeps {
  midi?: {
    listen: (cb: (message: MidiMessage) => void) => () => void
    sendClockTick: () => void
    sendStart: () => void
    sendStop: () => void
    selectedOutputId: { value: string | null }
  }
}

const MIDI_CLOCKS_PER_QUARTER = 24

export function useSync(initialMode: SyncMode = 'internal', deps?: SyncDeps) {
  const state = ref<SyncState>({
    bpm: 120,
    phase: 0,
    isPlaying: false,
    mode: initialMode,
    role: 'master',
    linkAvailable: false
  })
  const intervalId = ref<number | null>(null)
  let midiUnsubscribe: (() => void) | null = null

  const stopClock = () => {
    if (intervalId.value !== null) {
      clearInterval(intervalId.value)
      intervalId.value = null
    }
    deps?.midi?.sendStop()
  }

  const tick = () => {
    state.value.phase = (state.value.phase + 1) % MIDI_CLOCKS_PER_QUARTER
  }

  const startClock = () => {
    stopClock()
    if (state.value.mode !== 'midiClock' || state.value.role !== 'master') return
    if (!deps?.midi?.selectedOutputId.value) return
    const intervalMs = (60000 / state.value.bpm) / MIDI_CLOCKS_PER_QUARTER
    deps.midi.sendStart()
    intervalId.value = window.setInterval(() => {
      deps.midi?.sendClockTick()
      tick()
    }, intervalMs)
  }

  const setMode = (mode: SyncMode) => {
    state.value.mode = mode
    stopClock()
  }

  const setRole = (role: SyncRole) => {
    state.value.role = role
    stopClock()
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
    state.value.bpm = bpm
    if (state.value.isPlaying && state.value.mode === 'midiClock' && state.value.role === 'master') {
      startClock()
    }
  }

  const handleMidiMessage = (message: MidiMessage) => {
    if (state.value.mode !== 'midiClock' || state.value.role !== 'slave') return
    if (message.type === 'start') {
      state.value.isPlaying = true
      state.value.phase = 0
    } else if (message.type === 'stop') {
      state.value.isPlaying = false
      state.value.phase = 0
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
