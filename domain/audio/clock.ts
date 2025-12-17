export interface RenderClock {
  ctx: BaseAudioContext
  isOffline: boolean
  now: () => number
}

export function createRenderClock(ctx: BaseAudioContext, isOffline = false): RenderClock {
  return {
    ctx,
    isOffline,
    now: () => ctx.currentTime
  }
}
