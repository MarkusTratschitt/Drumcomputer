const clampInt = (value) => {
    if (!Number.isFinite(value)) {
        return 0;
    }
    return Math.floor(value);
};
export function createTransportEngine(clock, scheduler, initial, audioHooks) {
    let cfg = initial;
    let isPlaying = false;
    let startTimeSec = 0;
    let lastStep = -1;
    let lastAbsoluteStep = -1;
    const listeners = new Set();
    const stepDurationSec = () => {
        const stepsPerBar = Math.max(1, cfg.gridSpec.division);
        const beatsPerBar = 4;
        const beatsPerStep = beatsPerBar / stepsPerBar;
        const secPerBeat = 60 / Math.max(1, cfg.bpm);
        return beatsPerStep * secPerBeat;
    };
    const totalSteps = () => {
        const steps = cfg.gridSpec.bars * cfg.gridSpec.division;
        return Math.max(0, clampInt(steps));
    };
    const normalizeStep = (step) => {
        const steps = Math.max(totalSteps(), 1);
        return ((step % steps) + steps) % steps;
    };
    const swingOffsetSec = (stepIndex) => {
        const swing = cfg.swing ?? 0;
        if (swing <= 0) {
            return 0;
        }
        const isOffBeat = stepIndex % 2 === 1;
        if (!isOffBeat) {
            return 0;
        }
        return stepDurationSec() * swing * 0.5;
    };
    const emit = () => {
        const steps = Math.max(totalSteps(), 1);
        const normalized = ((lastStep % steps) + steps) % steps;
        const state = {
            isPlaying,
            currentStep: normalized
        };
        for (const listener of listeners) {
            listener(state);
        }
    };
    const computeAbsoluteStepAt = (timeSec) => {
        const dur = stepDurationSec();
        const raw = (timeSec - startTimeSec) / dur;
        return clampInt(raw);
    };
    let lastScheduledStep = -1;
    const scheduleStepBoundary = (stepIndexAbsolute) => {
        if (stepIndexAbsolute === lastScheduledStep) {
            return;
        }
        const normalizedStep = normalizeStep(stepIndexAbsolute);
        lastScheduledStep = stepIndexAbsolute;
        const stepTimeSec = startTimeSec +
            stepIndexAbsolute * stepDurationSec() +
            swingOffsetSec(normalizedStep);
        scheduler.schedule(stepTimeSec, (audioTime) => {
            audioHooks?.onStep(normalizedStep, audioTime);
        });
    };
    const advance = () => {
        const now = clock.audioTime();
        const currentAbsolute = computeAbsoluteStepAt(now);
        const current = normalizeStep(currentAbsolute);
        if (current !== lastStep) {
            lastStep = current;
            lastAbsoluteStep = currentAbsolute;
            scheduleStepBoundary(lastAbsoluteStep + 1);
            emit();
        }
    };
    return {
        start() {
            if (isPlaying) {
                return;
            }
            isPlaying = true;
            startTimeSec = clock.audioTime();
            lastStep = -1;
            lastAbsoluteStep = -1;
            lastScheduledStep = -1;
            scheduler.clear();
            scheduler.start();
            lastAbsoluteStep = computeAbsoluteStepAt(startTimeSec);
            lastStep = normalizeStep(lastAbsoluteStep);
            emit();
            scheduleStepBoundary(lastAbsoluteStep + 1);
        },
        stop() {
            if (!isPlaying) {
                return;
            }
            isPlaying = false;
            scheduler.stop();
            scheduler.clear();
            lastStep = -1;
            lastScheduledStep = -1;
            emit();
        },
        setConfig(next) {
            cfg = next;
            if (isPlaying) {
                const now = clock.audioTime();
                const dur = stepDurationSec();
                const steps = Math.max(totalSteps(), 1);
                const current = ((lastAbsoluteStep % steps) + steps) % steps;
                startTimeSec = now - lastAbsoluteStep * dur - swingOffsetSec(current);
                lastAbsoluteStep = computeAbsoluteStepAt(now);
                lastStep = normalizeStep(lastAbsoluteStep);
                if (lastScheduledStep < lastAbsoluteStep) {
                    lastScheduledStep = lastAbsoluteStep;
                }
            }
            else {
                lastScheduledStep = -1;
            }
            emit();
        },
        subscribe(listener) {
            listeners.add(listener);
            listener({
                isPlaying,
                currentStep: Math.max(0, lastStep)
            });
            return () => {
                listeners.delete(listener);
            };
        },
        tick() {
            if (!isPlaying) {
                return;
            }
            advance();
        }
    };
}
//# sourceMappingURL=transportEngine.js.map