import { defineStore } from 'pinia'
import { DEFAULT_GRID_SPEC, normalizeGridSpec } from '@/domain/timing'
import type { GridSpec } from '@/types/time'

export const useTransportStore = defineStore('transport', {
  state: () => ({
    bpm: 120,
    isPlaying: false,
    loop: true,
    gridSpec: { ...DEFAULT_GRID_SPEC } as GridSpec,
    currentStep: 0
  }),
  actions: {
    setBpm(bpm: number) {
      this.bpm = bpm
    },
    setPlaying(isPlaying: boolean) {
      this.isPlaying = isPlaying
    },
    setGridSpec(gridSpec: GridSpec) {
      this.gridSpec = normalizeGridSpec(gridSpec)
    },
    setLoop(loop: boolean) {
      this.loop = loop
    },
    setCurrentStep(step: number) {
      this.currentStep = step
    }
  }
})
