import { ref } from 'vue'
import type { SyncMode, SyncRole, SyncState } from '~/types/sync'

export function useSync(initialMode: SyncMode = 'internal') {
  const state = ref<SyncState>({ bpm: 120, phase: 0, isPlaying: false, mode: initialMode, role: 'master' })

  const setMode = (mode: SyncMode) => {
    state.value.mode = mode
  }

  const setRole = (role: SyncRole) => {
    state.value.role = role
  }

  const setPlaying = (isPlaying: boolean) => {
    state.value.isPlaying = isPlaying
  }

  const setBpm = (bpm: number) => {
    state.value.bpm = bpm
  }

  const tick = (phase: number) => {
    state.value.phase = phase
  }

  return {
    state,
    setMode,
    setRole,
    setPlaying,
    setBpm,
    tick
  }
}
