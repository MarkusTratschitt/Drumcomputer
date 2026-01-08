// Lookahead scheduler that batches callbacks scheduled within a horizon relative to the audio clock.
const DEFAULT_OPTIONS = {
    lookaheadSec: 0.1,
    intervalMs: 25
};
export function createScheduler(clock, options = {}) {
    const cfg = { ...DEFAULT_OPTIONS, ...options };
    let timerId = null;
    let wasRunningOnHide = false;
    let queue = [];
    const flush = () => {
        const now = clock.audioTime();
        const horizon = now + cfg.lookaheadSec;
        queue.sort((a, b) => a.at - b.at);
        const due = [];
        const pending = [];
        for (const item of queue) {
            if (item.at <= horizon) {
                due.push(item);
            }
            else {
                pending.push(item);
            }
        }
        queue = pending;
        for (const item of due) {
            item.fn(item.at);
        }
    };
    const startTimer = () => {
        if (clock.isOffline) {
            return;
        }
        if (timerId) {
            return;
        }
        timerId = setInterval(flush, cfg.intervalMs);
    };
    const stopTimer = () => {
        if (!timerId) {
            return;
        }
        clearInterval(timerId);
        timerId = null;
    };
    if (typeof window !== 'undefined') {
        const handlePageHide = () => {
            if (timerId) {
                wasRunningOnHide = true;
                stopTimer();
            }
            else {
                wasRunningOnHide = false;
            }
        };
        const handlePageShow = () => {
            if (wasRunningOnHide) {
                startTimer();
                flush();
            }
        };
        window.addEventListener('pagehide', handlePageHide);
        window.addEventListener('pageshow', handlePageShow);
    }
    return {
        start() {
            startTimer();
        },
        stop() {
            stopTimer();
        },
        schedule(atTimeSec, fn) {
            queue.push({ at: atTimeSec, fn });
        },
        clear() {
            queue = [];
        }
    };
}
//# sourceMappingURL=scheduler.js.map