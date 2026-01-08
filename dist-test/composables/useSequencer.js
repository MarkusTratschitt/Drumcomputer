import { ref } from 'vue';
import { quantizeToStep } from '@/domain/quantize';
import { normalizeGridSpec, secondsPerStep } from '@/domain/timing';
import { useTransportStore } from '@/stores/transport';
import { useScheduler } from './useScheduler';
import { useAudioEngine } from './useAudioEngine.client';
import { clampVelocity, cycleVelocity, DEFAULT_STEP_VELOCITY } from '@/domain/velocity';
import { createRenderClock } from '@/domain/clock/renderClock';
const totalStepsForGrid = (gridSpec) => gridSpec.bars * gridSpec.division;
export function scheduleStep(options, when) {
    const pattern = options.getPattern();
    const totalSteps = totalStepsForGrid(pattern.gridSpec);
    const loopStart = Math.min(Math.max(0, options.transport.loopStart), Math.max(0, totalSteps - 1));
    const loopEnd = Math.min(Math.max(loopStart + 1, options.transport.loopEnd), totalSteps);
    const loopLength = Math.max(1, loopEnd - loopStart);
    const stepIndex = loopStart +
        (((options.currentStep.value - loopStart) % loopLength) + loopLength) %
            loopLength;
    const barIndex = Math.floor(stepIndex / pattern.gridSpec.division);
    const stepInBar = stepIndex % pattern.gridSpec.division;
    const scheduledWhen = Math.max(when, options.clock.now());
    options.pendingSteps.value.push({ when: scheduledWhen, stepAddress: { barIndex, stepInBar } });
    options.scheduler.schedule({
        when: scheduledWhen,
        callback: () => {
            const bar = pattern.steps[barIndex];
            const stepRow = bar?.[stepInBar];
            if (stepRow) {
                Object.entries(stepRow).forEach(([padId, cell]) => {
                    options.audio.trigger({
                        padId: padId,
                        when: scheduledWhen,
                        velocity: cell?.velocity?.value ?? 1
                    });
                });
            }
            const rawNext = options.currentStep.value + 1;
            const nextStepInLoop = loopStart + (((rawNext - loopStart) % loopLength) + loopLength) % loopLength;
            const isPatternBoundary = nextStepInLoop === 0;
            if (options.transport.metronomeEnabled) {
                const isQuarter = pattern.gridSpec.division % 4 === 0
                    ? stepInBar % (pattern.gridSpec.division / 4) === 0
                    : stepInBar === 0;
                if (isQuarter) {
                    void options.audio.triggerClick(scheduledWhen, isPatternBoundary, options.transport.metronomeVolume);
                }
            }
            let nextPattern = pattern;
            if (isPatternBoundary && options.onPatternBoundary) {
                const candidate = options.onPatternBoundary();
                if (candidate) {
                    nextPattern = candidate;
                    options.transport.setGridSpec(nextPattern.gridSpec);
                }
                else {
                    nextPattern = options.getPattern();
                }
            }
            options.currentStep.value = nextStepInLoop;
            options.transport.setCurrentStep(options.currentStep.value);
            if (options.transport.loop) {
                const stepDuration = secondsPerStep(options.transport.bpm, nextPattern.gridSpec.division);
                scheduleStep(options, scheduledWhen + stepDuration);
            }
        }
    });
}
export function useSequencer(options) {
    const transport = useTransportStore();
    const audio = useAudioEngine();
    let renderClock = null;
    const scheduler = useScheduler({
        lookahead: options.lookahead ?? 25,
        scheduleAheadSec: options.scheduleAheadSec ?? 0.1,
        getTime: () => renderClock?.now() ?? 0
    });
    const currentStep = ref(0);
    const isRecording = ref(false);
    const pendingSteps = ref([]);
    let loopStartTime = 0;
    const boundaryCallback = options.onPatternBoundary ?? (() => undefined);
    const buildStepOptions = (clock) => ({
        clock,
        scheduler,
        audio,
        transport,
        getPattern: options.getPattern,
        currentStep,
        pendingSteps,
        onPatternBoundary: boundaryCallback
    });
    const start = async () => {
        if (transport.isPlaying)
            return;
        const ctx = await audio.resumeContext();
        renderClock = createRenderClock(ctx);
        const pattern = options.getPattern();
        const gridSpec = normalizeGridSpec(pattern.gridSpec);
        pattern.gridSpec = gridSpec;
        transport.setGridSpec(gridSpec);
        loopStartTime = renderClock.now();
        currentStep.value = Math.max(0, transport.loopStart);
        pendingSteps.value = [];
        transport.setCurrentStep(currentStep.value);
        transport.setPlaying(true);
        scheduler.clear();
        const stepOptions = buildStepOptions(renderClock);
        scheduleStep(stepOptions, loopStartTime);
        scheduler.start();
        scheduler.tick();
    };
    const stop = () => {
        transport.setPlaying(false);
        scheduler.stop();
        scheduler.clear();
        pendingSteps.value = [];
        currentStep.value = Math.max(0, transport.loopStart);
        transport.setCurrentStep(currentStep.value);
        loopStartTime = 0;
        renderClock = null;
    };
    const toggleStep = (barIndex, stepInBar, padId) => {
        const pattern = options.getPattern();
        const bar = pattern.steps[barIndex] ?? {};
        const stepRow = bar[stepInBar] ?? {};
        const updated = { ...stepRow };
        const nextVelocity = cycleVelocity(updated[padId]?.velocity?.value);
        if (nextVelocity === null) {
            delete updated[padId];
        }
        else {
            updated[padId] = { velocity: { value: clampVelocity(nextVelocity) } };
        }
        pattern.steps[barIndex] = { ...bar, [stepInBar]: updated };
    };
    const setStepVelocity = (barIndex, stepInBar, padId, velocity) => {
        const pattern = options.getPattern();
        const bar = pattern.steps[barIndex] ?? {};
        const stepRow = bar[stepInBar] ?? {};
        const updated = { ...stepRow, [padId]: { velocity: { value: clampVelocity(velocity || DEFAULT_STEP_VELOCITY) } } };
        pattern.steps[barIndex] = { ...bar, [stepInBar]: updated };
    };
    const recordHit = async (padId, velocity = 1, quantize = true) => {
        const pattern = options.getPattern();
        const ctx = await audio.resumeContext();
        const gridSpec = pattern.gridSpec;
        const stepDuration = secondsPerStep(transport.bpm, gridSpec.division);
        const resolvedVelocity = clampVelocity(velocity);
        const anchor = transport.isPlaying ? loopStartTime : ctx.currentTime;
        if (!transport.isPlaying) {
            loopStartTime = anchor;
        }
        const sinceStart = ctx.currentTime - anchor;
        const step = quantize
            ? quantizeToStep(sinceStart, stepDuration, gridSpec.bars, gridSpec.division)
            : {
                barIndex: Math.floor(currentStep.value / gridSpec.division),
                stepInBar: currentStep.value % gridSpec.division
            };
        setStepVelocity(step.barIndex, step.stepInBar, padId, resolvedVelocity);
        audio.trigger({ padId, when: ctx.currentTime, velocity: resolvedVelocity });
    };
    const setSampleForPad = async (padId, sample) => {
        await audio.setSampleForPad(padId, sample);
    };
    const applySoundbank = async (bank) => {
        await audio.applySoundbank(bank);
    };
    const getAudioTime = () => renderClock?.now() ?? audio.ensureContext().currentTime;
    return {
        currentStep,
        isRecording,
        pendingSteps,
        start,
        stop,
        toggleStep,
        setStepVelocity,
        recordHit,
        fxSettings: audio.fxSettings,
        setFx: audio.setFx,
        setSampleForPad,
        applySoundbank,
        getAudioTime
    };
}
//# sourceMappingURL=useSequencer.js.map