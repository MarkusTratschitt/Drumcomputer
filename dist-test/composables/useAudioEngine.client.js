import { onBeforeUnmount, ref } from 'vue';
import { createSeededRandom } from '@/utils/seededRandom';
import { createFxGraph, connectFxGraph, updateFxGraph } from '@/audio/fxGraph';
const cloneFxSettings = (settings) => ({
    filter: { ...settings.filter },
    drive: { ...settings.drive },
    reverb: { ...settings.reverb }
});
const createAudioEngineInstance = () => {
    const audioContext = ref(null);
    const masterGain = ref(null);
    const sampleCache = ref(new Map());
    const fxSettings = ref({
        filter: { enabled: true, frequency: 12000, q: 0.7 },
        drive: { enabled: false, amount: 0.25 },
        reverb: { enabled: false, mix: 0.15 }
    });
    const fxSnapshot = ref(cloneFxSettings(fxSettings.value));
    const fxGraph = ref(null);
    let randomSource = createSeededRandom(0);
    let wasRunningOnHide = false;
    let handlePageHide = null;
    let handlePageShow = null;
    const syncFxSnapshot = () => {
        fxSnapshot.value = cloneFxSettings(fxSettings.value);
        return fxSnapshot.value;
    };
    const ensureFxGraph = (ctx, snapshot) => {
        if (!masterGain.value) {
            return;
        }
        if (!fxGraph.value) {
            fxGraph.value = createFxGraph(ctx);
            connectFxGraph(fxGraph.value, masterGain.value);
        }
        updateFxGraph(ctx, fxGraph.value, snapshot, randomSource);
    };
    const ensureContext = () => {
        if (!audioContext.value) {
            const context = new AudioContext();
            const gain = context.createGain();
            gain.gain.value = 0.8;
            gain.connect(context.destination);
            audioContext.value = context;
            masterGain.value = gain;
        }
        ensureFxGraph(audioContext.value, fxSnapshot.value);
        return audioContext.value;
    };
    const resumeContext = async () => {
        const ctx = ensureContext();
        if (ctx.state === 'suspended') {
            await ctx.resume();
        }
        return ctx;
    };
    const getFxSnapshot = () => cloneFxSettings(fxSnapshot.value);
    const setFxRandomSource = (source) => {
        randomSource = source;
        if (fxGraph.value?.reverbNode) {
            fxGraph.value.reverbNode.buffer = null;
        }
        if (audioContext.value) {
            ensureFxGraph(audioContext.value, fxSnapshot.value);
        }
    };
    const decodeSample = async (sample) => {
        const ctx = ensureContext();
        if (sample.buffer) {
            return sample.buffer;
        }
        if (sample.blob) {
            const arrayBuffer = await sample.blob.arrayBuffer();
            return ctx.decodeAudioData(arrayBuffer.slice(0));
        }
        if (sample.url) {
            const response = await fetch(sample.url);
            const arrayBuffer = await response.arrayBuffer();
            return ctx.decodeAudioData(arrayBuffer);
        }
        return null;
    };
    const setSampleForPad = async (padId, sample) => {
        const buffer = sample.buffer ?? (await decodeSample(sample));
        if (buffer) {
            sampleCache.value.set(padId, buffer);
        }
    };
    const applySoundbank = async (bank) => {
        const entries = Object.entries(bank.pads);
        await Promise.all(entries.map(async ([padId, sample]) => {
            if (sample) {
                await setSampleForPad(padId, sample);
            }
        }));
    };
    const setFx = (partial) => {
        fxSettings.value = {
            filter: { ...fxSettings.value.filter, ...(partial.filter ?? {}) },
            drive: { ...fxSettings.value.drive, ...(partial.drive ?? {}) },
            reverb: { ...fxSettings.value.reverb, ...(partial.reverb ?? {}) }
        };
        const snapshot = syncFxSnapshot();
        const ctx = ensureContext();
        ensureFxGraph(ctx, snapshot);
    };
    const trigger = async ({ padId, when, velocity = 1 }) => {
        const ctx = ensureContext();
        const buffer = sampleCache.value.get(padId) ?? null;
        if (!buffer) {
            return;
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const gain = ctx.createGain();
        gain.gain.value = velocity;
        source.connect(gain);
        if (fxGraph.value) {
            gain.connect(fxGraph.value.fxInput);
        }
        else {
            gain.connect(masterGain.value ?? ctx.destination);
        }
        source.start(when);
    };
    const triggerClick = async (when, accented = false, volume = 0.12) => {
        const ctx = ensureContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.value = accented ? 2200 : 1600;
        const base = Math.max(0, Math.min(1, volume));
        gain.gain.setValueAtTime((accented ? 1.4 : 1) * base, when);
        gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.06);
        osc.connect(gain);
        gain.connect(masterGain.value ?? ctx.destination);
        osc.start(when);
        osc.stop(when + 0.08);
    };
    if (typeof window !== 'undefined') {
        handlePageHide = () => {
            if (audioContext.value) {
                wasRunningOnHide = audioContext.value.state === 'running';
                void audioContext.value.suspend().catch(() => undefined);
            }
        };
        handlePageShow = () => {
            if (wasRunningOnHide && audioContext.value) {
                void audioContext.value.resume().catch(() => undefined);
            }
            wasRunningOnHide = false;
        };
        window.addEventListener('pagehide', handlePageHide);
        window.addEventListener('pageshow', handlePageShow);
    }
    onBeforeUnmount(() => {
        if (handlePageHide) {
            window.removeEventListener('pagehide', handlePageHide);
        }
        if (handlePageShow) {
            window.removeEventListener('pageshow', handlePageShow);
        }
        audioContext.value?.close();
        sampleCache.value.clear();
    });
    return {
        audioContext,
        masterGain,
        sampleCache,
        fxSettings,
        ensureContext,
        resumeContext,
        decodeSample,
        applySoundbank,
        setFx,
        setSampleForPad,
        trigger,
        triggerClick,
        getFxSnapshot,
        setFxRandomSource
    };
};
let audioEngineInstance = null;
export function useAudioEngine() {
    if (!audioEngineInstance) {
        audioEngineInstance = createAudioEngineInstance();
    }
    return audioEngineInstance;
}
//# sourceMappingURL=useAudioEngine.client.js.map