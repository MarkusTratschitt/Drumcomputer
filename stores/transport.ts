import { defineStore } from 'pinia'
import type { GridSpec } from '~/types/time'

export const useTransportStore = defineStore('transport', {
  state: () => ({
    bpm: 120,
    isPlaying: false,
    loop: true,
    gridSpec: { bars: 1, division: 16 } as GridSpec,
    swing: 0
  }),
  actions: {
    setBpm(bpm: number) {
      this.bpm = bpm
    },
    setPlaying(isPlaying: boolean) {
      this.isPlaying = isPlaying
    },
    setGridSpec(gridSpec: GridSpec) {
      this.gridSpec = gridSpec
    },
    setSwing(amount: number) {
      this.swing = amount
    }
  }
})
