import { describe, it, expect, beforeEach } from 'vitest';
import { createTransportEngine } from '@/domain/transport/transportEngine';
const createTestClock = (initialTime = 0) => {
    let now = initialTime;
    const clock = {
        ctx: {},
        isOffline: false,
        audioTime: () => now,
        now: () => now
    };
    return {
        clock,
        setTime: (next) => {
            now = next;
        }
    };
};
const createStubScheduler = () => {
    const calls = [];
    let start = 0;
    let stop = 0;
    let clear = 0;
    const scheduler = {
        start() {
            start += 1;
        },
        stop() {
            stop += 1;
        },
        schedule(atTimeSec, fn) {
            calls.push({ at: atTimeSec, fn });
        },
        clear() {
            clear += 1;
            calls.length = 0;
        }
    };
    return {
        scheduler,
        calls,
        counts: () => ({ start, stop, clear })
    };
};
describe('transportEngine', () => {
    const baseConfig = {
        bpm: 120,
        gridSpec: { bars: 1, division: 4 }
    };
    let states;
    beforeEach(() => {
        states = [];
    });
    it('starts playback, emits state and schedules the first boundary', () => {
        const { clock, setTime } = createTestClock(0);
        const schedulerStub = createStubScheduler();
        const engine = createTransportEngine(clock, schedulerStub.scheduler, baseConfig);
        const unsubscribe = engine.subscribe((state) => states.push(state));
        expect(states).to.deep.equal([{ isPlaying: false, currentStep: 0 }]);
        engine.start();
        setTime(0.1);
        const lastState = states[states.length - 1];
        expect(lastState).to.deep.equal({ isPlaying: true, currentStep: 0 });
        const counts = schedulerStub.counts();
        expect(counts.start).to.equal(1);
        expect(counts.clear).to.equal(1);
        expect(schedulerStub.calls).to.have.lengthOf(1);
        expect(schedulerStub.calls[0].at).to.be.closeTo(0.5, 0.0001);
        unsubscribe();
    });
    it('advances steps on tick and schedules subsequent boundaries', () => {
        const { clock, setTime } = createTestClock(0);
        const schedulerStub = createStubScheduler();
        const engine = createTransportEngine(clock, schedulerStub.scheduler, baseConfig);
        engine.subscribe((state) => states.push(state));
        engine.start();
        setTime(0.51);
        engine.tick();
        const lastState = states[states.length - 1];
        expect(lastState).to.deep.equal({ isPlaying: true, currentStep: 1 });
        expect(schedulerStub.calls).to.have.lengthOf(2);
        expect(schedulerStub.calls[1].at).to.be.closeTo(1, 0.0001);
    });
    it('stops playback, clears scheduler, and ignores further ticks', () => {
        const { clock } = createTestClock(0);
        const schedulerStub = createStubScheduler();
        const engine = createTransportEngine(clock, schedulerStub.scheduler, baseConfig);
        engine.subscribe((state) => states.push(state));
        engine.start();
        schedulerStub.calls.length = 0;
        engine.stop();
        const counts = schedulerStub.counts();
        expect(counts.stop).to.equal(1);
        expect(counts.clear).to.equal(2);
        const lastState = states[states.length - 1];
        expect(lastState).to.deep.equal({ isPlaying: false, currentStep: 3 });
        engine.tick();
        expect(schedulerStub.calls).to.have.lengthOf(0);
    });
    it('keeps phase stable when the config changes during playback', () => {
        const { clock, setTime } = createTestClock(0);
        const schedulerStub = createStubScheduler();
        const engine = createTransportEngine(clock, schedulerStub.scheduler, baseConfig);
        engine.subscribe((state) => states.push(state));
        engine.start();
        setTime(0.51);
        engine.tick();
        expect(states.at(-1)).to.deep.equal({ isPlaying: true, currentStep: 1 });
        engine.setConfig({
            bpm: 120,
            gridSpec: { bars: 1, division: 8 }
        });
        expect(states.at(-1)).to.deep.equal({ isPlaying: true, currentStep: 1 });
        setTime(0.76);
        engine.tick();
        expect(states.at(-1)).to.deep.equal({ isPlaying: true, currentStep: 2 });
        expect(schedulerStub.calls).to.have.lengthOf(3);
        expect(schedulerStub.calls[2].at).to.be.closeTo(1.01, 0.0001);
    });
    it('applies swing offset to off-beat scheduling and forwards onStep callbacks', () => {
        const { clock } = createTestClock(0);
        const schedulerStub = createStubScheduler();
        const hookCalls = [];
        const audioHooks = {
            onStep(stepIndex, audioTime) {
                hookCalls.push({ stepIndex, audioTime });
            }
        };
        const engine = createTransportEngine(clock, schedulerStub.scheduler, {
            bpm: 120,
            gridSpec: { bars: 1, division: 4 },
            swing: 0.5
        }, audioHooks);
        engine.subscribe((state) => states.push(state));
        engine.start();
        expect(schedulerStub.calls[0].at).to.be.closeTo(0.625, 0.0001);
        schedulerStub.calls[0].fn(schedulerStub.calls[0].at);
        expect(hookCalls).to.deep.equal([
            { stepIndex: 1, audioTime: schedulerStub.calls[0].at }
        ]);
    });
});
//# sourceMappingURL=transportEngine.spec.js.map