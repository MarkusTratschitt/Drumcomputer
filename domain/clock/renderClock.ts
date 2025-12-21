export interface RenderClock {
  readonly ctx: BaseAudioContext

  /**
   * Indicates whether the clock is used for offline rendering.
   * Offline clocks must not rely on real-time scheduling.
   */
  readonly isOffline: boolean

  /**
   * Current audio time in seconds.
   * This is always based on the underlying AudioContext.
   */
  audioTime(): number

  /**
   * Alias for audioTime(), for compatibility.
   */
  now(): number
}

export function createRenderClock(


  ctx: BaseAudioContext,
  isOffline = false
): RenderClock {
  return {
    ctx,
    isOffline,
    audioTime: () => ctx.currentTime,
    now: () => ctx.currentTime
  }
}
