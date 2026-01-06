import { defineStore } from 'pinia'
import { DEFAULT_GRID_SPEC, normalizeGridSpec } from '@/domain/timing'
import type { GridSpec } from '@/types/time'

export const useTransportStore = defineStore('transport', {
  state: () => ({
    bpm: 120,
    isPlaying: false,
    loop: true,
    gridSpec: { ...DEFAULT_GRID_SPEC } as GridSpec,
    currentStep: 0,
    isRecording: false,
    countInEnabled: false,
    countInBars: 1,
    metronomeEnabled: false,
    metronomeVolume: 0.12,
    followEnabled: true,
    loopStart: 0,
    loopEnd: DEFAULT_GRID_SPEC.bars * DEFAULT_GRID_SPEC.division
  }),
  actions: {
    setBpm(bpm: number) {
      this.bpm = bpm
    },
    setPlaying(isPlaying: boolean) {
      this.isPlaying = isPlaying
    },
    setGridSpec(gridSpec: GridSpec) {
      const prevTotal = this.gridSpec.bars * this.gridSpec.division
      this.gridSpec = normalizeGridSpec(gridSpec)
      const nextTotal = this.gridSpec.bars * this.gridSpec.division
      if (prevTotal > 0 && nextTotal > 0) {
        const startRatio = this.loopStart / prevTotal
        const endRatio = this.loopEnd / prevTotal
        const nextStart = Math.floor(startRatio * nextTotal)
        const nextEnd = Math.max(nextStart + 1, Math.round(endRatio * nextTotal))
        this.setLoopRange(nextStart, nextEnd)
      } else {
        this.setLoopRange(0, nextTotal)
      }
    },
    setLoop(loop: boolean) {
      this.loop = loop
    },
    setCurrentStep(step: number) {
      this.currentStep = step
    },
    setRecording(isRecording: boolean) {
      this.isRecording = isRecording
    },
    setCountInEnabled(enabled: boolean) {
      this.countInEnabled = enabled
    },
    setCountInBars(bars: number) {
      const normalized = Math.max(1, Math.floor(bars))
      this.countInBars = normalized
    },
    setMetronomeEnabled(enabled: boolean) {
      this.metronomeEnabled = enabled
    },
    setMetronomeVolume(volume: number) {
      const clamped = Math.max(0, Math.min(1, volume))
      this.metronomeVolume = clamped
    },
    setFollowEnabled(enabled: boolean) {
      this.followEnabled = enabled
    },
    setLoopRange(start: number, end: number) {
      const total = this.gridSpec.bars * this.gridSpec.division
      const clampedStart = Math.max(0, Math.min(start, total - 1))
      const clampedEnd = Math.max(clampedStart + 1, Math.min(end, total))
      this.loopStart = clampedStart
      this.loopEnd = clampedEnd
    },
    nudgeLoopRange(delta: number) {
      const length = this.loopEnd - this.loopStart
      this.setLoopRange(this.loopStart + delta, this.loopStart + delta + length)
    }
  }
})
