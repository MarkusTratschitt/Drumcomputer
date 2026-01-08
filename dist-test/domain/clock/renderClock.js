export function createRenderClock(ctx, isOffline = false) {
    return {
        ctx,
        isOffline,
        audioTime: () => ctx.currentTime,
        now: () => ctx.currentTime
    };
}
//# sourceMappingURL=renderClock.js.map