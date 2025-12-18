export interface TransportAudioHooks {
  onStep(stepIndex: number, audioTime: number): void
}
