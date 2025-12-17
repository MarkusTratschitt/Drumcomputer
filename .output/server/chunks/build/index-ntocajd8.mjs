import { defineComponent, mergeProps, ref, resolveComponent, withCtx, createTextVNode, createVNode, toDisplayString, createBlock, openBlock, Fragment, renderList, createCommentVNode, renderSlot, useSSRContext } from 'vue';
import { saveAs } from 'file-saver';
import { _ as _export_sfc, e as __nuxt_component_3, d as defineStore } from './server.mjs';
import { Midi } from '@tonejs/midi';
import { ssrRenderComponent, ssrRenderAttrs, ssrRenderList, ssrInterpolate, ssrRenderSlot } from 'vue/server-renderer';
import '../nitro/nitro.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'vue-router';

const GRID_DIVISIONS = [1, 2, 4, 8, 16, 32, 64];
const DEFAULT_GRID_SPEC = { bars: 1, division: 16 };
function secondsPerStep(bpm, division) {
  return 60 / bpm * (4 / division);
}
function normalizeGridSpec(gridSpec) {
  const division = GRID_DIVISIONS.includes(gridSpec?.division ?? DEFAULT_GRID_SPEC.division) ? gridSpec?.division : DEFAULT_GRID_SPEC.division;
  const bars = gridSpec?.bars === 1 || gridSpec?.bars === 2 || gridSpec?.bars === 4 || gridSpec?.bars === 8 ? gridSpec.bars : DEFAULT_GRID_SPEC.bars;
  return { bars, division };
}
const useTransportStore = defineStore("transport", {
  state: () => ({
    bpm: 120,
    isPlaying: false,
    loop: true,
    gridSpec: { ...DEFAULT_GRID_SPEC },
    currentStep: 0
  }),
  actions: {
    setBpm(bpm) {
      this.bpm = bpm;
    },
    setPlaying(isPlaying) {
      this.isPlaying = isPlaying;
    },
    setGridSpec(gridSpec) {
      this.gridSpec = normalizeGridSpec(gridSpec);
    },
    setLoop(loop) {
      this.loop = loop;
    },
    setCurrentStep(step) {
      this.currentStep = step;
    }
  }
});
const STEP_VELOCITY_LEVELS = [0.7, 1, 1.25];
const DEFAULT_STEP_VELOCITY = STEP_VELOCITY_LEVELS[0];
const ACCENT_STEP_VELOCITY = STEP_VELOCITY_LEVELS[STEP_VELOCITY_LEVELS.length - 1];
const EPSILON = 1e-3;
const matchesLevel = (value, level) => Math.abs(value - level) < EPSILON;
function clampVelocity(value) {
  const resolved = typeof value === "number" ? value : DEFAULT_STEP_VELOCITY;
  const clamped = Math.max(STEP_VELOCITY_LEVELS[0], Math.min(ACCENT_STEP_VELOCITY, resolved));
  const closest = STEP_VELOCITY_LEVELS.find((level) => matchesLevel(clamped, level));
  return closest ?? clamped;
}
function cycleVelocity(current) {
  if (typeof current !== "number") {
    return DEFAULT_STEP_VELOCITY;
  }
  const index2 = STEP_VELOCITY_LEVELS.findIndex((level) => matchesLevel(current, level));
  if (index2 === -1) {
    return DEFAULT_STEP_VELOCITY;
  }
  const nextIndex = index2 + 1;
  if (nextIndex >= STEP_VELOCITY_LEVELS.length) {
    return null;
  }
  const nextValue = STEP_VELOCITY_LEVELS[nextIndex];
  if (typeof nextValue !== "number") {
    return null;
  }
  return nextValue;
}
const createDefaultGrid = () => ({ ...DEFAULT_GRID_SPEC });
const createEmptyPattern = (id, name) => ({
  id,
  name,
  gridSpec: createDefaultGrid(),
  steps: {}
});
const createScene = (id, name, patternIds = []) => ({
  id,
  name,
  patternIds
});
const HISTORY_LIMIT = 50;
const usePatternsStore = defineStore("patterns", {
  state: () => ({
    patterns: [createEmptyPattern("pattern-1", "Pattern 1")],
    scenes: [],
    selectedPatternId: "pattern-1",
    activeSceneId: null,
    scenePosition: 0,
    history: [],
    historyIndex: -1,
    isRestoring: false
  }),
  getters: {
    currentPattern(state) {
      return state.patterns.find((p) => p.id === state.selectedPatternId) ?? createEmptyPattern("pattern-1", "Pattern 1");
    },
    currentScene(state) {
      return state.scenes.find((scene) => scene.id === state.activeSceneId) ?? null;
    }
  },
  actions: {
    snapshotState() {
      return {
        patterns: JSON.parse(JSON.stringify(this.patterns)),
        scenes: JSON.parse(JSON.stringify(this.scenes)),
        selectedPatternId: this.selectedPatternId,
        activeSceneId: this.activeSceneId
      };
    },
    recordHistory() {
      if (this.isRestoring) return;
      const snapshot = this.snapshotState();
      this.history = this.history.slice(0, this.historyIndex + 1);
      this.history.push(snapshot);
      if (this.history.length > HISTORY_LIMIT) {
        this.history.shift();
        this.historyIndex -= 1;
      }
      this.historyIndex = this.history.length - 1;
    },
    restoreSnapshot(snapshot) {
      this.isRestoring = true;
      this.patterns = snapshot.patterns.map((pattern) => ({
        ...pattern,
        gridSpec: normalizeGridSpec(pattern.gridSpec)
      }));
      this.setScenes(snapshot.scenes);
      this.selectedPatternId = snapshot.selectedPatternId;
      if (!this.patterns.find((pattern) => pattern.id === this.selectedPatternId)) {
        this.selectedPatternId = this.patterns[0]?.id ?? "pattern-1";
      }
      this.activeSceneId = snapshot.activeSceneId;
      this.scenePosition = 0;
      this.isRestoring = false;
    },
    undo() {
      if (this.historyIndex <= 0) return;
      this.historyIndex -= 1;
      const snapshot = this.history[this.historyIndex];
      if (snapshot) {
        this.restoreSnapshot(snapshot);
      }
    },
    redo() {
      if (this.historyIndex >= this.history.length - 1) return;
      this.historyIndex += 1;
      const snapshot = this.history[this.historyIndex];
      if (snapshot) {
        this.restoreSnapshot(snapshot);
      }
    },
    selectPattern(id) {
      this.selectedPatternId = id;
    },
    addPattern(name) {
      this.recordHistory();
      const nextIndex = this.patterns.length + 1;
      const id = `pattern-${Date.now()}-${nextIndex}`;
      const pattern = createEmptyPattern(id, name ?? `Pattern ${nextIndex}`);
      this.patterns.push(pattern);
      this.selectedPatternId = pattern.id;
    },
    renamePattern(id, name) {
      this.recordHistory();
      const pattern = this.patterns.find((entry) => entry.id === id);
      if (pattern) {
        pattern.name = name;
      }
    },
    setScenes(scenes) {
      const allowedIds = this.patterns.map((pattern) => pattern.id);
      this.scenes = scenes.map((scene) => ({
        ...scene,
        patternIds: scene.patternIds.filter((id) => allowedIds.includes(id))
      }));
      if (this.activeSceneId && !this.scenes.find((scene) => scene.id === this.activeSceneId)) {
        this.activeSceneId = null;
        this.scenePosition = 0;
      }
    },
    setPatterns(patterns) {
      this.patterns = patterns.length ? patterns : [createEmptyPattern("pattern-1", "Pattern 1")];
      if (!this.patterns.find((pattern) => pattern.id === this.selectedPatternId)) {
        this.selectedPatternId = this.patterns[0]?.id ?? "pattern-1";
      }
      const allowedIds = this.patterns.map((pattern) => pattern.id);
      this.scenes = this.scenes.map((scene) => ({
        ...scene,
        patternIds: scene.patternIds.filter((id) => allowedIds.includes(id))
      }));
      if (this.activeSceneId && !this.scenes.find((scene) => scene.id === this.activeSceneId)) {
        this.activeSceneId = null;
        this.scenePosition = 0;
      }
    },
    toggleStep(barIndex, stepInBar, padId) {
      this.recordHistory();
      const pattern = this.currentPattern;
      const grid = pattern.steps;
      const bar = grid[barIndex] ?? {};
      const stepRow = bar[stepInBar] ?? {};
      const updated = { ...stepRow };
      const nextVelocity = cycleVelocity(updated[padId]?.velocity?.value);
      if (nextVelocity === null) {
        delete updated[padId];
      } else {
        updated[padId] = { velocity: { value: clampVelocity(nextVelocity) } };
      }
      grid[barIndex] = { ...bar, [stepInBar]: updated };
    },
    setStepVelocity(barIndex, stepInBar, padId, velocity) {
      this.recordHistory();
      const pattern = this.currentPattern;
      const grid = pattern.steps;
      const bar = grid[barIndex] ?? {};
      const stepRow = bar[stepInBar] ?? {};
      const updated = { ...stepRow };
      updated[padId] = { velocity: { value: clampVelocity(velocity || DEFAULT_STEP_VELOCITY) } };
      grid[barIndex] = { ...bar, [stepInBar]: updated };
    },
    updateGridSpec(gridSpec) {
      this.recordHistory();
      const pattern = this.currentPattern;
      pattern.gridSpec = normalizeGridSpec(gridSpec);
    },
    addScene(name, patternIds = []) {
      this.recordHistory();
      const id = `scene-${Date.now()}-${this.scenes.length + 1}`;
      this.scenes.push(createScene(id, name, patternIds));
      this.activeSceneId = id;
      this.scenePosition = 0;
    },
    updateScene(sceneId, updates) {
      this.recordHistory();
      const scene = this.scenes.find((entry) => entry.id === sceneId);
      if (!scene) return;
      if (updates.name) {
        scene.name = updates.name;
      }
      if (updates.patternIds) {
        const allowed = this.patterns.map((pattern) => pattern.id);
        scene.patternIds = updates.patternIds.filter((id) => allowed.includes(id));
      }
    },
    selectScene(sceneId) {
      this.activeSceneId = sceneId;
      this.scenePosition = 0;
    },
    prepareScenePlayback() {
      this.scenePosition = 0;
      const scene = this.currentScene;
      if (scene && scene.patternIds.length > 0) {
        const nextId = scene.patternIds[0];
        if (nextId) {
          this.selectedPatternId = nextId;
        }
        this.scenePosition = scene.patternIds.length > 1 ? 1 : 0;
      }
    },
    advanceScenePlayback() {
      const scene = this.currentScene;
      if (!scene || scene.patternIds.length === 0) {
        return this.currentPattern;
      }
      const nextId = scene.patternIds[this.scenePosition % scene.patternIds.length];
      this.scenePosition = (this.scenePosition + 1) % scene.patternIds.length;
      if (nextId) {
        this.selectedPatternId = nextId;
      }
      return this.currentPattern;
    }
  }
});
const useSoundbanksStore = defineStore("soundbanks", {
  state: () => ({
    banks: [],
    selectedBankId: ""
  }),
  getters: {
    currentBank(state) {
      return state.banks.find((bank) => bank.id === state.selectedBankId);
    }
  },
  actions: {
    setBanks(banks) {
      this.banks = banks;
      if (!this.selectedBankId && banks.length > 0) {
        const first = banks[0];
        if (first) {
          this.selectedBankId = first.id;
        }
      }
    },
    selectBank(id) {
      this.selectedBankId = id;
    },
    upsertBank(bank) {
      const index2 = this.banks.findIndex((b) => b.id === bank.id);
      if (index2 >= 0) {
        this.banks.splice(index2, 1, bank);
      } else {
        this.banks.push(bank);
      }
    }
  }
});
const useSessionStore = defineStore("session", {
  state: () => ({
    midiInput: void 0,
    midiOutput: void 0,
    audioReady: false,
    capabilities: {
      supportsWebMIDI: false,
      supportsAudioInput: false
    }
  }),
  actions: {
    setMidiInput(device) {
      this.midiInput = device;
    },
    setMidiOutput(device) {
      this.midiOutput = device;
    },
    setAudioReady(isReady) {
      this.audioReady = isReady;
    },
    setCapabilities(capabilities) {
      this.capabilities = capabilities;
    }
  }
});
function quantizeToStep(time, secondsPerStep2, bars, division) {
  const totalSteps = bars * division;
  const stepIndex = Math.max(0, Math.min(totalSteps - 1, Math.round(time / secondsPerStep2)));
  return {
    barIndex: Math.floor(stepIndex / division),
    stepInBar: stepIndex % division
  };
}
function useScheduler(config) {
  const tasks = ref([]);
  const intervalId = ref(null);
  const tick = () => {
    const now = config.getTime();
    const windowLimit = now + config.scheduleAheadSec;
    const ready = tasks.value.filter((task) => task.when <= windowLimit);
    tasks.value = tasks.value.filter((task) => task.when > windowLimit);
    ready.forEach((task) => task.callback());
  };
  const start = () => {
    if (intervalId.value !== null) return;
    intervalId.value = (void 0).setInterval(tick, config.lookahead);
  };
  const stop = () => {
    if (intervalId.value !== null) {
      clearInterval(intervalId.value);
      intervalId.value = null;
    }
  };
  const schedule = (task) => {
    tasks.value.push(task);
  };
  const clear = () => {
    tasks.value = [];
  };
  return {
    start,
    stop,
    clear,
    tick,
    schedule
  };
}
function createSeededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value += 1831565813;
    let t = value;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
const createFxGraph = (ctx) => ({
  fxInput: ctx.createGain(),
  driveNode: ctx.createWaveShaper(),
  filterNode: (() => {
    const node = ctx.createBiquadFilter();
    node.type = "lowpass";
    return node;
  })(),
  dryGain: ctx.createGain(),
  wetGain: ctx.createGain(),
  reverbNode: ctx.createConvolver(),
  connected: false
});
const connectFxGraph = (graph, masterGain) => {
  if (graph.connected) return;
  graph.fxInput.connect(graph.driveNode);
  graph.driveNode.connect(graph.filterNode);
  graph.filterNode.connect(graph.dryGain);
  graph.filterNode.connect(graph.reverbNode);
  graph.reverbNode.connect(graph.wetGain);
  graph.dryGain.connect(masterGain);
  graph.wetGain.connect(masterGain);
  graph.connected = true;
};
const updateFxGraph = (ctx, graph, snapshot, rng) => {
  const now = ctx.currentTime;
  const frequencyValue = snapshot.filter.enabled ? snapshot.filter.frequency : ctx.sampleRate / 2;
  graph.filterNode.frequency.setValueAtTime(frequencyValue, now);
  graph.filterNode.Q.setValueAtTime(snapshot.filter.q, now);
  const amount = snapshot.drive.enabled ? snapshot.drive.amount : 0;
  graph.driveNode.curve = createDriveCurve(amount);
  const mix = snapshot.reverb.enabled ? snapshot.reverb.mix : 0;
  graph.dryGain.gain.setValueAtTime(Math.max(0, 1 - mix), now);
  graph.wetGain.gain.setValueAtTime(Math.max(0, Math.min(1, mix)), now);
  if (snapshot.reverb.enabled) {
    if (!graph.reverbNode.buffer) {
      graph.reverbNode.buffer = createImpulseResponse(ctx, rng);
    }
  } else if (graph.reverbNode.buffer) {
    graph.reverbNode.buffer = null;
  }
};
const createDriveCurve = (amount) => {
  const k = Math.max(0, amount) * 50 + 1;
  const samples = 1024;
  const curve = new Float32Array(samples);
  for (let i = 0; i < samples; i += 1) {
    const x = i * 2 / samples - 1;
    curve[i] = (1 + k) * x / (1 + k * Math.abs(x));
  }
  return curve;
};
const createImpulseResponse = (ctx, rng, duration = 1.2, decay = 2.5) => {
  const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
    const channelData = impulse.getChannelData(channel);
    for (let i = 0; i < length; i += 1) {
      channelData[i] = (rng() * 2 - 1) * Math.pow(1 - i / length, decay);
    }
  }
  return impulse;
};
const cloneFxSettings = (settings) => ({
  filter: { ...settings.filter },
  drive: { ...settings.drive },
  reverb: { ...settings.reverb }
});
const createAudioEngineInstance = () => {
  const audioContext = ref(null);
  const masterGain = ref(null);
  const sampleCache = ref(/* @__PURE__ */ new Map());
  const fxSettings = ref({
    filter: { enabled: true, frequency: 12e3, q: 0.7 },
    drive: { enabled: false, amount: 0.25 },
    reverb: { enabled: false, mix: 0.15 }
  });
  const fxSnapshot = ref(cloneFxSettings(fxSettings.value));
  const fxGraph = ref(null);
  let randomSource = createSeededRandom(0);
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
    if (ctx.state === "suspended") {
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
    const buffer = sample.buffer ?? await decodeSample(sample);
    if (buffer) {
      sampleCache.value.set(padId, buffer);
    }
  };
  const applySoundbank = async (bank) => {
    const entries = Object.entries(bank.pads);
    await Promise.all(
      entries.map(async ([padId, sample]) => {
        if (sample) {
          await setSampleForPad(padId, sample);
        }
      })
    );
  };
  const setFx = (partial) => {
    fxSettings.value = {
      filter: { ...fxSettings.value.filter, ...partial.filter ?? {} },
      drive: { ...fxSettings.value.drive, ...partial.drive ?? {} },
      reverb: { ...fxSettings.value.reverb, ...partial.reverb ?? {} }
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
    } else {
      gain.connect(masterGain.value ?? ctx.destination);
    }
    source.start(when);
  };
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
    getFxSnapshot,
    setFxRandomSource
  };
};
let audioEngineInstance = null;
function useAudioEngine() {
  if (!audioEngineInstance) {
    audioEngineInstance = createAudioEngineInstance();
  }
  return audioEngineInstance;
}
function createRenderClock(ctx, isOffline = false) {
  return {
    ctx,
    isOffline,
    now: () => ctx.currentTime
  };
}
const totalStepsForGrid = (gridSpec) => gridSpec.bars * gridSpec.division;
function scheduleStep(options, when) {
  const pattern = options.getPattern();
  const totalSteps = totalStepsForGrid(pattern.gridSpec);
  const stepIndex = options.currentStep.value % totalSteps;
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
            padId,
            when: scheduledWhen,
            velocity: cell?.velocity?.value ?? 1
          });
        });
      }
      options.currentStep.value = (options.currentStep.value + 1) % totalSteps;
      options.transport.setCurrentStep(options.currentStep.value);
      const isPatternBoundary = options.currentStep.value === 0;
      let nextPattern = pattern;
      if (isPatternBoundary && options.onPatternBoundary) {
        const candidate = options.onPatternBoundary();
        if (candidate) {
          nextPattern = candidate;
          options.transport.setGridSpec(nextPattern.gridSpec);
        } else {
          nextPattern = options.getPattern();
        }
      }
      if (options.transport.loop) {
        const stepDuration = secondsPerStep(options.transport.bpm, nextPattern.gridSpec.division);
        scheduleStep(options, scheduledWhen + stepDuration);
      }
    }
  });
}
function useSequencer(options) {
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
  const boundaryCallback = options.onPatternBoundary ?? (() => void 0);
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
    if (transport.isPlaying) return;
    const ctx = await audio.resumeContext();
    renderClock = createRenderClock(ctx);
    const pattern = options.getPattern();
    const gridSpec = normalizeGridSpec(pattern.gridSpec);
    pattern.gridSpec = gridSpec;
    transport.setGridSpec(gridSpec);
    loopStartTime = renderClock.now();
    currentStep.value = 0;
    pendingSteps.value = [];
    transport.setCurrentStep(0);
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
    currentStep.value = 0;
    transport.setCurrentStep(0);
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
    } else {
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
    const step = quantize ? quantizeToStep(sinceStart, stepDuration, gridSpec.bars, gridSpec.division) : {
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
const MIDI_CLOCKS_PER_QUARTER = 24;
const CLOCK_AUTHORITY = "audioContext";
function useSync(initialMode = "internal", deps) {
  const state = ref({
    bpm: 120,
    phase: 0,
    isPlaying: false,
    mode: initialMode,
    role: "master",
    linkAvailable: false,
    clockAuthority: CLOCK_AUTHORITY,
    bpmSource: "transport"
  });
  const scheduler = deps?.getAudioTime ? useScheduler({
    lookahead: 25,
    scheduleAheadSec: 0.05,
    getTime: deps.getAudioTime
  }) : null;
  const lastStableBpm = ref(state.value.bpm);
  let nextClockAt = null;
  const secondsPerClockTick = () => 60 / (state.value.bpm * MIDI_CLOCKS_PER_QUARTER);
  const resetPhase = () => {
    state.value.phase = 0;
  };
  const stopClock = () => {
    scheduler?.stop();
    scheduler?.clear();
    nextClockAt = null;
    deps?.midi?.sendStop();
  };
  const tick = () => {
    state.value.phase = (state.value.phase + 1) % MIDI_CLOCKS_PER_QUARTER;
  };
  const scheduleClockTick = () => {
    if (!scheduler || nextClockAt === null) return;
    scheduler.schedule({
      when: nextClockAt,
      callback: () => {
        deps?.midi?.sendClockTick();
        tick();
        if (nextClockAt !== null) {
          nextClockAt = nextClockAt + secondsPerClockTick();
          scheduleClockTick();
        }
      }
    });
  };
  const startClock = () => {
    stopClock();
    if (state.value.mode !== "midiClock" || state.value.role !== "master") return;
    if (!deps?.midi?.selectedOutputId.value) return;
    if (!deps?.getAudioTime || !scheduler) return;
    const now = deps.getAudioTime();
    nextClockAt = now + secondsPerClockTick();
    deps.midi.sendStart();
    scheduleClockTick();
    scheduler.start();
    scheduler.tick();
  };
  const setMode = (mode) => {
    state.value.mode = mode;
    state.value.bpm = lastStableBpm.value;
    stopClock();
    if (state.value.isPlaying && state.value.mode === "midiClock" && state.value.role === "master") {
      startClock();
    }
  };
  const setRole = (role) => {
    state.value.role = role;
    state.value.bpm = lastStableBpm.value;
    stopClock();
    if (state.value.isPlaying && state.value.mode === "midiClock" && state.value.role === "master") {
      startClock();
    }
  };
  const setPlaying = (isPlaying) => {
    state.value.isPlaying = isPlaying;
    if (isPlaying) {
      startClock();
    } else {
      stopClock();
    }
  };
  const setBpm = (bpm) => {
    state.value.bpm = Math.max(20, Math.min(300, bpm));
    lastStableBpm.value = state.value.bpm;
    if (state.value.isPlaying && state.value.mode === "midiClock" && state.value.role === "master") {
      startClock();
    }
  };
  const handleMidiMessage = (message) => {
    if (state.value.mode !== "midiClock" || state.value.role !== "slave") return;
    if (message.type === "start") {
      state.value.isPlaying = true;
      resetPhase();
      deps?.onExternalStart?.();
    } else if (message.type === "stop") {
      state.value.isPlaying = false;
      resetPhase();
      deps?.onExternalStop?.();
    } else if (message.type === "clock") {
      tick();
    }
  };
  const startTransport = (bpm) => {
    setBpm(bpm);
    setPlaying(true);
  };
  const stopTransport = () => {
    setPlaying(false);
  };
  if (deps?.midi) {
    deps.midi.listen(handleMidiMessage);
  }
  return {
    state,
    setMode,
    setRole,
    setPlaying,
    setBpm,
    startTransport,
    stopTransport
  };
}
const defaultPads = [
  "pad1",
  "pad2",
  "pad3",
  "pad4",
  "pad5",
  "pad6",
  "pad7",
  "pad8",
  "pad9",
  "pad10",
  "pad11",
  "pad12",
  "pad13",
  "pad14",
  "pad15",
  "pad16"
];
function defaultMidiMapping() {
  const noteMap = {};
  const noteMapInverse = {};
  defaultPads.forEach((padId, index2) => {
    const note = 36 + index2;
    noteMap[note] = padId;
    noteMapInverse[padId] = note;
  });
  return { noteMap, noteMapInverse };
}
function useMidi() {
  const access = ref(null);
  const inputs = ref([]);
  const outputs = ref([]);
  const mapping = ref(defaultMidiMapping());
  const selectedInputId = ref(null);
  const selectedOutputId = ref(null);
  const listeners = ref(/* @__PURE__ */ new Set());
  const supportsMidi = () => false;
  const refreshDevices = () => {
    if (!access.value) return;
    inputs.value = Array.from(access.value.inputs.values()).map((device) => ({
      id: device.id,
      name: device.name ?? "MIDI In",
      type: "input"
    }));
    outputs.value = Array.from(access.value.outputs.values()).map((device) => ({
      id: device.id,
      name: device.name ?? "MIDI Out",
      type: "output"
    }));
  };
  const requestAccess = async () => {
    {
      return;
    }
  };
  const handleMidiMessage = (event) => {
    if (!event.data || event.data.length < 1) return;
    const status = event.data[0];
    const data1 = event.data[1];
    const data2 = event.data[2];
    if (status === void 0) return;
    const type = status & 240;
    const hasNoteData = typeof data1 === "number" && typeof data2 === "number";
    const message = type === 144 && hasNoteData && data2 > 0 ? { type: "noteon", note: data1, velocity: data2 / 127 } : type === 128 && hasNoteData ? { type: "noteoff", note: data1, velocity: data2 / 127 } : type === 144 && hasNoteData && data2 === 0 ? { type: "noteoff", note: data1, velocity: data2 / 127 } : status === 248 ? { type: "clock" } : status === 250 ? { type: "start" } : status === 252 ? { type: "stop" } : null;
    if (!message) return;
    listeners.value.forEach((cb) => cb(message));
  };
  const detachInputs = () => {
    access.value?.inputs.forEach((input) => {
      input.onmidimessage = null;
    });
  };
  const attachSelectedInput = () => {
    detachInputs();
    if (!selectedInputId.value) return;
    const input = access.value?.inputs.get(selectedInputId.value);
    if (input) {
      input.onmidimessage = handleMidiMessage;
    }
  };
  const listen = (cb) => {
    listeners.value.add(cb);
    attachSelectedInput();
    return () => listeners.value.delete(cb);
  };
  const send = (deviceId, message) => {
    const output = access.value?.outputs.get(deviceId);
    if (!output) return;
    switch (message.type) {
      case "noteon":
        output.send([144, message.note ?? 0, Math.floor((message.velocity ?? 1) * 127)]);
        break;
      case "noteoff":
        output.send([128, message.note ?? 0, 0]);
        break;
      case "start":
        output.send([250]);
        break;
      case "stop":
        output.send([252]);
        break;
      case "clock":
        output.send([248]);
        break;
    }
  };
  const sendClockTick = () => {
    if (selectedOutputId.value) {
      send(selectedOutputId.value, { type: "clock" });
    }
  };
  const sendStart = () => {
    if (selectedOutputId.value) {
      send(selectedOutputId.value, { type: "start" });
    }
  };
  const sendStop = () => {
    if (selectedOutputId.value) {
      send(selectedOutputId.value, { type: "stop" });
    }
  };
  const setSelectedInput = (id) => {
    selectedInputId.value = id;
    attachSelectedInput();
  };
  const setSelectedOutput = (id) => {
    selectedOutputId.value = id;
  };
  const mapNoteToPad = (note) => mapping.value.noteMap[note];
  const setPadForNote = (note, padId) => {
    if (padId) {
      mapping.value.noteMap[note] = padId;
    } else {
      delete mapping.value.noteMap[note];
    }
  };
  return {
    access,
    inputs,
    outputs,
    mapping,
    selectedInputId,
    selectedOutputId,
    supportsMidi,
    requestAccess,
    refreshDevices,
    listen,
    send,
    sendClockTick,
    sendStart,
    sendStop,
    mapNoteToPad,
    setPadForNote,
    setSelectedInput,
    setSelectedOutput
  };
}
function usePatternStorage() {
  const lastSavedAt = ref(null);
  const save = (payload) => {
    return;
  };
  const load = () => {
    {
      return { patterns: [], scenes: [], selectedPatternId: "pattern-1", activeSceneId: null };
    }
  };
  const clear = () => {
    return;
  };
  return {
    save,
    load,
    clear,
    lastSavedAt
  };
}
const DB_NAME = "drum-machine-db";
const DB_VERSION = 2;
const stripNonSerializableSample = (sample) => {
  if (!sample) return void 0;
  const sanitized = {
    id: sample.id,
    name: sample.name
  };
  if (sample.url !== void 0) {
    sanitized.url = sample.url;
  }
  if (sample.format !== void 0) {
    sanitized.format = sample.format;
  }
  return sanitized;
};
const serializeSoundbank = (bank) => {
  const pads = {};
  Object.entries(bank.pads).forEach(([padId, sample]) => {
    const sanitized = stripNonSerializableSample(sample);
    if (sanitized) {
      pads[padId] = sanitized;
    }
  });
  return {
    id: bank.id,
    name: bank.name,
    createdAt: bank.createdAt,
    updatedAt: bank.updatedAt,
    pads
  };
};
function useSoundbankStorage() {
  const dbRef = ref(null);
  const open = () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains("soundbanks")) {
          db.createObjectStore("soundbanks", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("samples")) {
          db.createObjectStore("samples", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("patterns")) {
          const store = db.createObjectStore("patterns", { keyPath: "id" });
          store.createIndex("bankId", "bankId", { unique: false });
        }
      };
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        dbRef.value = request.result;
        resolve(request.result);
      };
    });
  };
  const ensureDb = async () => {
    if (dbRef.value) return dbRef.value;
    return open();
  };
  const saveBank = async (bank) => {
    const db = await ensureDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(["soundbanks"], "readwrite");
      tx.objectStore("soundbanks").put(serializeSoundbank(bank));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  };
  const saveSample = async (sample) => {
    const db = await ensureDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(["samples"], "readwrite");
      const record = { id: sample.id, name: sample.name, blob: sample.blob };
      if (sample.format) {
        record.format = sample.format;
      }
      tx.objectStore("samples").put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  };
  const loadBanks = async () => {
    const db = await ensureDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(["soundbanks"], "readonly");
      const request = tx.objectStore("soundbanks").getAll();
      request.onsuccess = () => resolve(request.result ?? []);
      request.onerror = () => reject(request.error);
    });
  };
  const loadSample = async (sampleId) => {
    const db = await ensureDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(["samples"], "readonly");
      const request = tx.objectStore("samples").get(sampleId);
      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          resolve(null);
          return;
        }
        const restored = { id: result.id, name: result.name, blob: result.blob };
        const format = result.format;
        if (format) {
          restored.format = format;
        }
        resolve(restored);
      };
      request.onerror = () => reject(request.error);
    });
  };
  const savePatterns = async (bankId, patterns) => {
    const db = await ensureDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(["patterns"], "readwrite");
      patterns.forEach((pattern) => {
        const record = { id: `${bankId}:${pattern.id}`, bankId, pattern };
        tx.objectStore("patterns").put(record);
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  };
  const loadPatterns = async (bankId) => {
    const db = await ensureDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(["patterns"], "readonly");
      const index2 = tx.objectStore("patterns").index("bankId");
      const request = index2.getAll(bankId);
      request.onsuccess = () => {
        const records = request.result ?? [];
        resolve(records.map((record) => record.pattern));
      };
      request.onerror = () => reject(request.error);
    });
  };
  return {
    saveBank,
    saveSample,
    loadBanks,
    loadSample,
    savePatterns,
    loadPatterns
  };
}
const encoderHeader = "Drumcomputer Pattern Export";
const audioBufferToWav = (buffer) => {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const result = new ArrayBuffer(length);
  const view = new DataView(result);
  let offset = 0;
  const writeString = (str) => {
    for (let i = 0; i < str.length; i += 1) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
    offset += str.length;
  };
  const setUint16 = (data) => {
    view.setUint16(offset, data, true);
    offset += 2;
  };
  const setUint32 = (data) => {
    view.setUint32(offset, data, true);
    offset += 4;
  };
  writeString("RIFF");
  setUint32(length - 8);
  writeString("WAVE");
  writeString("fmt ");
  setUint32(16);
  setUint16(1);
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * numOfChan * 2);
  setUint16(numOfChan * 2);
  setUint16(16);
  writeString("data");
  setUint32(length - offset - 4);
  const channels = [];
  for (let i = 0; i < numOfChan; i += 1) {
    channels.push(buffer.getChannelData(i));
  }
  while (offset < length) {
    for (let i = 0; i < numOfChan; i += 1) {
      const channel = channels[i];
      if (!channel) {
        offset += 2;
        continue;
      }
      const sampleIndex = Math.floor((offset - 44) / (2 * numOfChan));
      const rawSample = channel[sampleIndex] ?? 0;
      const sample = Math.max(-1, Math.min(1, rawSample));
      view.setInt16(offset, sample < 0 ? sample * 32768 : sample * 32767, true);
      offset += 2;
    }
  }
  return result;
};
const normalizePattern = (pattern) => {
  const gridSpec = normalizeGridSpec(pattern.gridSpec);
  const steps = {};
  Object.entries(pattern.steps ?? {}).forEach(([barKey, barValue]) => {
    const barIndex = Number(barKey);
    if (Number.isNaN(barIndex)) return;
    const normalizedBar = {};
    Object.entries(barValue ?? {}).forEach(([stepKey, stepValue]) => {
      const stepInBar = Number(stepKey);
      if (Number.isNaN(stepInBar)) return;
      const normalizedRow = {};
      Object.entries(stepValue ?? {}).forEach(([padId, cell]) => {
        if (!cell) return;
        normalizedRow[padId] = {
          velocity: { value: clampVelocity(cell.velocity?.value ?? DEFAULT_STEP_VELOCITY) }
        };
      });
      if (Object.keys(normalizedRow).length > 0) {
        normalizedBar[stepInBar] = normalizedRow;
      }
    });
    if (Object.keys(normalizedBar).length > 0) {
      steps[barIndex] = normalizedBar;
    }
  });
  return {
    ...pattern,
    gridSpec,
    steps
  };
};
const patternFromMidi = (midi, mapping) => {
  const gridSpec = { bars: 1, division: 16 };
  const steps = {};
  const track = midi.tracks[0];
  if (!track) {
    return normalizePattern({
      id: "imported-pattern",
      name: "Imported Pattern",
      gridSpec,
      steps
    });
  }
  const ticksPerBeat = midi.header.ppq;
  const stepTicks = ticksPerBeat * 4 / gridSpec.division;
  const notes = track.notes ?? [];
  notes.forEach((note) => {
    const stepIndex = Math.round(note.ticks / stepTicks);
    const barIndex = Math.floor(stepIndex / gridSpec.division);
    const stepInBar = stepIndex % gridSpec.division;
    const pad = mapping.noteMap[note.midi];
    if (!pad) return;
    const bar = steps[barIndex] ?? {};
    const row = bar[stepInBar] ?? {};
    const velocity = typeof note.velocity === "number" ? note.velocity : DEFAULT_STEP_VELOCITY;
    row[pad] = { velocity: { value: clampVelocity(velocity) } };
    bar[stepInBar] = row;
    steps[barIndex] = bar;
  });
  return normalizePattern({
    id: "imported-pattern",
    name: track.name ?? "Imported Pattern",
    gridSpec,
    steps
  });
};
function useImportExport() {
  const exportPattern = (pattern) => {
    const normalized = normalizePattern(pattern);
    const blob = new Blob([JSON.stringify(normalized, null, 2)], { type: "application/json" });
    saveAs(blob, `${normalized.name}.json`);
  };
  const importPattern = async (file) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      return normalizePattern(parsed);
    } catch (error) {
      console.error("Failed to import pattern", error);
      return {
        id: `imported-${Date.now()}`,
        name: file.name,
        gridSpec: { bars: 1, division: 16 },
        steps: {}
      };
    }
  };
  const exportMidi = (pattern, bpm, mapping = defaultMidiMapping()) => {
    const midi = new Midi();
    midi.header.setTempo(bpm);
    const track = midi.addTrack();
    const ticksPerBeat = midi.header.ppq;
    const stepTicks = ticksPerBeat * 4 / pattern.gridSpec.division;
    const totalSteps = pattern.gridSpec.bars * pattern.gridSpec.division;
    for (let i = 0; i < totalSteps; i += 1) {
      const barIndex = Math.floor(i / pattern.gridSpec.division);
      const stepInBar = i % pattern.gridSpec.division;
      const row = pattern.steps[barIndex]?.[stepInBar];
      if (!row) continue;
      Object.entries(row).forEach(([padId, cell]) => {
        const drumPad = padId;
        const note = mapping.noteMapInverse?.[drumPad] ?? Object.entries(mapping.noteMap).find(([, pad]) => pad === drumPad)?.[0];
        if (typeof note !== "string" && typeof note !== "number") return;
        const midiNote = typeof note === "string" ? Number(note) : note;
        if (typeof midiNote !== "number") return;
        track.addNote({
          midi: midiNote,
          time: i * stepTicks / ticksPerBeat,
          duration: stepTicks / ticksPerBeat,
          velocity: cell?.velocity?.value ?? 1
        });
      });
    }
    const midiArray = midi.toArray();
    const midiBuffer = midiArray.buffer;
    const blob = new Blob([midiBuffer], { type: "audio/midi" });
    saveAs(blob, `${pattern.name}.mid`);
  };
  const importMidi = async (file, mapping = defaultMidiMapping()) => {
    const buffer = await file.arrayBuffer();
    const midi = new Midi(buffer);
    return patternFromMidi(midi, mapping);
  };
  const createScenePlaybackTracker = (patternsStore) => {
    const scene = patternsStore.currentScene;
    const patternList = scene?.patternIds ?? [];
    const fallbackPattern = patternsStore.patterns[0] ?? {
      id: "pattern-1",
      name: "Pattern 1",
      gridSpec: { ...DEFAULT_GRID_SPEC },
      steps: {}
    };
    let currentPatternId = patternList[0] ?? patternsStore.selectedPatternId ?? fallbackPattern.id;
    let scenePosition = patternList.length > 1 ? 1 : 0;
    const resolvePattern = (id) => patternsStore.patterns.find((pattern) => pattern.id === id) ?? fallbackPattern;
    const getPattern = () => resolvePattern(currentPatternId);
    const advancePattern = () => {
      if (!scene || patternList.length === 0) {
        return getPattern();
      }
      const nextId = patternList[scenePosition % patternList.length];
      scenePosition = (scenePosition + 1) % patternList.length;
      if (nextId) {
        currentPatternId = nextId;
      }
      return getPattern();
    };
    const initialPattern = getPattern();
    const patternChain = patternList.length > 0 ? [...patternList] : [patternsStore.selectedPatternId ?? initialPattern.id];
    return {
      sceneId: scene?.id ?? null,
      patternChain,
      initialPatternId: initialPattern.id,
      getPattern,
      advancePattern
    };
  };
  const createOfflineScheduler = (limit, updateClock) => {
    const tasks = [];
    return {
      schedule(task) {
        tasks.push(task);
        tasks.sort((a, b) => a.when - b.when);
      },
      run() {
        while (tasks.length > 0) {
          const next = tasks[0];
          if (!next || next.when > limit) break;
          tasks.shift();
          updateClock(next.when);
          next.callback();
        }
      }
    };
  };
  const slugifyName = (value) => {
    const cleaned = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    return cleaned || "session";
  };
  const collectPadIdsFromPatternChain = (patternChain, patternList) => {
    const padSet = /* @__PURE__ */ new Set();
    patternChain.forEach((patternId) => {
      const pattern = patternList.find((entry) => entry.id === patternId);
      if (!pattern) return;
      Object.values(pattern.steps ?? {}).forEach((bar) => {
        Object.values(bar ?? {}).forEach((stepRow) => {
          Object.keys(stepRow ?? {}).forEach((padId) => {
            padSet.add(padId);
          });
        });
      });
    });
    return Array.from(padSet);
  };
  const exportAudio = async (renderDurationSec, sampleRate = 44100, options = {}) => {
    const transport = useTransportStore();
    const patterns = usePatternsStore();
    const audio = useAudioEngine();
    const duration = Math.max(0, renderDurationSec);
    const frameCount = Math.max(1, Math.ceil(duration * sampleRate));
    const seedValue = options.seed ?? Date.now();
    const fxSnapshot = audio.getFxSnapshot();
    const baseSampleCache = new Map(audio.sampleCache.value);
    const metadataTracker = createScenePlaybackTracker(patterns);
    const metadataPattern = metadataTracker.getPattern();
    const initialGridSpec = normalizeGridSpec(metadataPattern.gridSpec ?? transport.gridSpec);
    const metadata = {
      seed: String(seedValue),
      bpm: transport.bpm,
      gridSpec: initialGridSpec,
      sceneId: metadataTracker.sceneId,
      patternChain: metadataTracker.patternChain,
      initialPatternId: metadataTracker.initialPatternId,
      durationSec: duration
    };
    const songSlug = slugifyName(patterns.currentScene?.name ?? metadataPattern.name ?? "drum-session");
    const candidatePadIds = collectPadIdsFromPatternChain(metadataTracker.patternChain, patterns.patterns);
    const stemPadIds = options.stems ? candidatePadIds.filter((padId) => baseSampleCache.has(padId)) : [];
    const renderPass = async (soloPadId, collectDebug = false) => {
      const context = new OfflineAudioContext(2, frameCount, sampleRate);
      const masterGainNode = context.createGain();
      masterGainNode.gain.value = 0.8;
      masterGainNode.connect(context.destination);
      const fxGraph = createFxGraph(context);
      connectFxGraph(fxGraph, masterGainNode);
      const rng = createSeededRandom(seedValue);
      updateFxGraph(context, fxGraph, fxSnapshot, rng);
      const sampleCache = new Map(baseSampleCache);
      const offlineEngine = {
        trigger({ padId, when, velocity = 1 }) {
          if (soloPadId && padId !== soloPadId) return;
          const buffer = sampleCache.get(padId);
          if (!buffer) return;
          const source = context.createBufferSource();
          source.buffer = buffer;
          const gainNode = context.createGain();
          gainNode.gain.value = velocity;
          source.connect(gainNode);
          gainNode.connect(fxGraph.fxInput);
          source.start(when);
        }
      };
      let simulatedTime = 0;
      const baseClock = createRenderClock(context, true);
      const renderClock = {
        ctx: baseClock.ctx,
        isOffline: true,
        now: () => simulatedTime
      };
      const offlineScheduler = createOfflineScheduler(duration, (time) => {
        simulatedTime = time;
      });
      const tracker = createScenePlaybackTracker(patterns);
      const initialPatternForRender = tracker.getPattern();
      const renderGridSpec = normalizeGridSpec(initialPatternForRender.gridSpec ?? transport.gridSpec);
      const currentStep = ref(0);
      const pendingSteps = ref([]);
      const offlineTransportBase = {
        loop: transport.loop,
        bpm: transport.bpm,
        gridSpec: renderGridSpec,
        setCurrentStep: () => {
        },
        setGridSpec(gridSpec) {
          offlineTransportBase.gridSpec = normalizeGridSpec(gridSpec);
        }
      };
      const offlineTransport = offlineTransportBase;
      const stepOptions = {
        clock: renderClock,
        scheduler: offlineScheduler,
        audio: offlineEngine,
        transport: offlineTransport,
        getPattern: () => tracker.getPattern(),
        currentStep,
        pendingSteps,
        onPatternBoundary: () => {
          const nextPattern = tracker.advancePattern();
          offlineTransport.setGridSpec(nextPattern.gridSpec);
          return nextPattern;
        }
      };
      scheduleStep(stepOptions, 0);
      offlineScheduler.run();
      simulatedTime = duration;
      const rendered = await context.startRendering();
      return {
        audioBuffer: rendered,
        debugEvents: void 0
      };
    };
    const mixdownResult = await renderPass(void 0, true);
    const mixdownBlob = new Blob([audioBufferToWav(mixdownResult.audioBuffer)], { type: "audio/wav" });
    saveAs(mixdownBlob, "mixdown.wav");
    const stemFiles = {};
    for (const padId of stemPadIds) {
      const stemResult = await renderPass(padId);
      const stemBlob = new Blob([audioBufferToWav(stemResult.audioBuffer)], { type: "audio/wav" });
      const fileName = `${songSlug}_${padId}.wav`;
      stemFiles[padId] = { fileName, blob: stemBlob };
    }
    const result = {
      audioBlob: mixdownBlob,
      metadata
    };
    if (Object.keys(stemFiles).length > 0) {
      result.stems = stemFiles;
    }
    return result;
  };
  const exportSoundbank = (bank, samples) => {
    const padEntries = Object.entries(bank.pads).reduce((acc, [padId, sample]) => {
      if (sample) {
        acc[padId] = { id: sample.id, name: sample.name, format: sample.format };
      }
      return acc;
    }, {});
    const manifest = {
      bank: { ...bank, pads: padEntries },
      samples: samples.map((sample) => {
        const entry = {
          id: sample.id,
          name: sample.name
        };
        if (sample.format) {
          entry.format = sample.format;
        }
        return entry;
      })
    };
    saveAs(new Blob([JSON.stringify(manifest, null, 2)], { type: "application/json" }), `${bank.name}-manifest.json`);
    samples.forEach((sample) => {
      if (sample.blob) {
        saveAs(sample.blob, sample.name);
      }
    });
  };
  const importSoundbank = async (manifestFile, sampleFiles) => {
    try {
      const manifestText = await manifestFile.text();
      const parsed = JSON.parse(manifestText);
      const sampleMap = new Map(sampleFiles.map((file) => [file.name, file]));
      const hydratedSamples = parsed.samples.map((sample) => {
        const blob = sampleMap.get(sample.name);
        if (blob) {
          return { ...sample, blob };
        }
        return { ...sample };
      });
      const padAssignments = {};
      Object.entries(parsed.bank.pads ?? {}).forEach(([padId, sampleInfo]) => {
        const found = hydratedSamples.find((sample) => sample.id === sampleInfo.id);
        if (found) {
          padAssignments[padId] = found;
        }
      });
      const hydratedBank = { ...parsed.bank, pads: padAssignments };
      return { bank: hydratedBank, samples: hydratedSamples };
    } catch (error) {
      console.error("Failed to import soundbank", error);
      return {
        bank: { id: "invalid-bank", name: manifestFile.name, pads: {}, createdAt: Date.now(), updatedAt: Date.now() },
        samples: []
      };
    }
  };
  const exportMidiData = (data) => {
    const blob = new Blob([encoderHeader, JSON.stringify(data)], { type: "application/json" });
    saveAs(blob, "sequence.mid.json");
  };
  return {
    exportPattern,
    importPattern,
    exportMidi,
    importMidi,
    exportMidiData,
    exportAudio,
    exportSoundbank,
    importSoundbank
  };
}
function useCapabilities() {
  const capabilities = ref({ supportsWebMIDI: false, supportsAudioInput: false });
  const evaluate = () => {
    capabilities.value = {
      supportsWebMIDI: false,
      supportsAudioInput: false
    };
  };
  evaluate();
  return {
    capabilities,
    evaluate
  };
}
const _sfc_main$c = defineComponent({
  name: "TransportBar",
  props: {
    bpm: { type: Number, required: true },
    isPlaying: { type: Boolean, required: true },
    loop: { type: Boolean, required: true },
    division: { type: Number, required: true },
    divisions: { type: Array, required: true }
  },
  emits: ["play", "stop", "bpm:update", "loop:update", "division:update"],
  computed: {
    divisionItems() {
      return this.divisions.map((value) => ({
        title: `1/${value}`,
        value
      }));
    }
  },
  methods: {
    onBpm(value) {
      const numeric = Number(value);
      if (!Number.isNaN(numeric)) {
        this.$emit("bpm:update", numeric);
      }
    },
    onDivision(value) {
      if (value) {
        this.$emit("division:update", value);
      }
    },
    toggleLoop() {
      this.$emit("loop:update", !this.loop);
    }
  }
});
function ssrRender$c(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  const _component_v_app_bar = resolveComponent("v-app-bar");
  const _component_v_btn = resolveComponent("v-btn");
  const _component_v_icon = resolveComponent("v-icon");
  const _component_v_text_field = resolveComponent("v-text-field");
  const _component_v_select = resolveComponent("v-select");
  _push(ssrRenderComponent(_component_v_app_bar, mergeProps({
    class: "transport-bar",
    dense: "",
    flat: ""
  }, _attrs), {
    default: withCtx((_, _push2, _parent2, _scopeId) => {
      if (_push2) {
        _push2(`<div class="transport-controls" data-v-ff233923${_scopeId}>`);
        _push2(ssrRenderComponent(_component_v_btn, {
          icon: "",
          disabled: _ctx.isPlaying,
          color: "primary",
          onClick: ($event) => _ctx.$emit("play"),
          "aria-label": "Play"
        }, {
          default: withCtx((_2, _push3, _parent3, _scopeId2) => {
            if (_push3) {
              _push3(ssrRenderComponent(_component_v_icon, null, {
                default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                  if (_push4) {
                    _push4(`mdi-play`);
                  } else {
                    return [
                      createTextVNode("mdi-play")
                    ];
                  }
                }),
                _: 1
              }, _parent3, _scopeId2));
            } else {
              return [
                createVNode(_component_v_icon, null, {
                  default: withCtx(() => [
                    createTextVNode("mdi-play")
                  ]),
                  _: 1
                })
              ];
            }
          }),
          _: 1
        }, _parent2, _scopeId));
        _push2(ssrRenderComponent(_component_v_btn, {
          icon: "",
          disabled: !_ctx.isPlaying,
          color: "error",
          onClick: ($event) => _ctx.$emit("stop"),
          "aria-label": "Stop"
        }, {
          default: withCtx((_2, _push3, _parent3, _scopeId2) => {
            if (_push3) {
              _push3(ssrRenderComponent(_component_v_icon, null, {
                default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                  if (_push4) {
                    _push4(`mdi-stop`);
                  } else {
                    return [
                      createTextVNode("mdi-stop")
                    ];
                  }
                }),
                _: 1
              }, _parent3, _scopeId2));
            } else {
              return [
                createVNode(_component_v_icon, null, {
                  default: withCtx(() => [
                    createTextVNode("mdi-stop")
                  ]),
                  _: 1
                })
              ];
            }
          }),
          _: 1
        }, _parent2, _scopeId));
        _push2(`</div><div class="transport-parameters" data-v-ff233923${_scopeId}>`);
        _push2(ssrRenderComponent(_component_v_text_field, {
          class: "bpm-input",
          dense: "",
          type: "number",
          label: "BPM",
          "model-value": _ctx.bpm,
          "onUpdate:modelValue": _ctx.onBpm,
          min: "40",
          max: "240",
          "hide-details": ""
        }, null, _parent2, _scopeId));
        _push2(ssrRenderComponent(_component_v_select, {
          class: "division-select",
          dense: "",
          label: "Division",
          items: _ctx.divisionItems,
          "item-title": "title",
          "item-value": "value",
          "model-value": _ctx.division,
          "onUpdate:modelValue": _ctx.onDivision,
          "hide-details": ""
        }, null, _parent2, _scopeId));
        _push2(ssrRenderComponent(_component_v_btn, {
          class: "loop-toggle",
          icon: "",
          color: _ctx.loop ? "cyan" : "grey",
          onClick: _ctx.toggleLoop,
          "aria-label": "Loop"
        }, {
          default: withCtx((_2, _push3, _parent3, _scopeId2) => {
            if (_push3) {
              _push3(ssrRenderComponent(_component_v_icon, {
                class: { "mdi-spin": _ctx.loop }
              }, {
                default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                  if (_push4) {
                    _push4(`mdi-repeat`);
                  } else {
                    return [
                      createTextVNode("mdi-repeat")
                    ];
                  }
                }),
                _: 1
              }, _parent3, _scopeId2));
            } else {
              return [
                createVNode(_component_v_icon, {
                  class: { "mdi-spin": _ctx.loop }
                }, {
                  default: withCtx(() => [
                    createTextVNode("mdi-repeat")
                  ]),
                  _: 1
                }, 8, ["class"])
              ];
            }
          }),
          _: 1
        }, _parent2, _scopeId));
        _push2(`</div>`);
      } else {
        return [
          createVNode("div", { class: "transport-controls" }, [
            createVNode(_component_v_btn, {
              icon: "",
              disabled: _ctx.isPlaying,
              color: "primary",
              onClick: ($event) => _ctx.$emit("play"),
              "aria-label": "Play"
            }, {
              default: withCtx(() => [
                createVNode(_component_v_icon, null, {
                  default: withCtx(() => [
                    createTextVNode("mdi-play")
                  ]),
                  _: 1
                })
              ]),
              _: 1
            }, 8, ["disabled", "onClick"]),
            createVNode(_component_v_btn, {
              icon: "",
              disabled: !_ctx.isPlaying,
              color: "error",
              onClick: ($event) => _ctx.$emit("stop"),
              "aria-label": "Stop"
            }, {
              default: withCtx(() => [
                createVNode(_component_v_icon, null, {
                  default: withCtx(() => [
                    createTextVNode("mdi-stop")
                  ]),
                  _: 1
                })
              ]),
              _: 1
            }, 8, ["disabled", "onClick"])
          ]),
          createVNode("div", { class: "transport-parameters" }, [
            createVNode(_component_v_text_field, {
              class: "bpm-input",
              dense: "",
              type: "number",
              label: "BPM",
              "model-value": _ctx.bpm,
              "onUpdate:modelValue": _ctx.onBpm,
              min: "40",
              max: "240",
              "hide-details": ""
            }, null, 8, ["model-value", "onUpdate:modelValue"]),
            createVNode(_component_v_select, {
              class: "division-select",
              dense: "",
              label: "Division",
              items: _ctx.divisionItems,
              "item-title": "title",
              "item-value": "value",
              "model-value": _ctx.division,
              "onUpdate:modelValue": _ctx.onDivision,
              "hide-details": ""
            }, null, 8, ["items", "model-value", "onUpdate:modelValue"]),
            createVNode(_component_v_btn, {
              class: "loop-toggle",
              icon: "",
              color: _ctx.loop ? "cyan" : "grey",
              onClick: _ctx.toggleLoop,
              "aria-label": "Loop"
            }, {
              default: withCtx(() => [
                createVNode(_component_v_icon, {
                  class: { "mdi-spin": _ctx.loop }
                }, {
                  default: withCtx(() => [
                    createTextVNode("mdi-repeat")
                  ]),
                  _: 1
                }, 8, ["class"])
              ]),
              _: 1
            }, 8, ["color", "onClick"])
          ])
        ];
      }
    }),
    _: 1
  }, _parent));
}
const _sfc_setup$c = _sfc_main$c.setup;
_sfc_main$c.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/TransportBar.vue");
  return _sfc_setup$c ? _sfc_setup$c(props, ctx) : void 0;
};
const __nuxt_component_0$3 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$c, [["ssrRender", ssrRender$c], ["__scopeId", "data-v-ff233923"]]), { __name: "TransportBar" });
const _sfc_main$b = defineComponent({
  name: "PadCell",
  props: {
    padId: { type: String, required: true },
    label: { type: String, required: true },
    isSelected: { type: Boolean, default: false },
    isTriggered: { type: Boolean, default: false },
    isPlaying: { type: Boolean, default: false }
  },
  emits: ["pad:down", "pad:select"],
  computed: {
    padClasses() {
      return {
        "is-selected": this.isSelected,
        "is-triggered": this.isTriggered,
        "is-playing": this.isPlaying
      };
    }
  },
  methods: {
    handleDown() {
      this.$emit("pad:down", this.padId);
    },
    handleSelect() {
      this.$emit("pad:select", this.padId);
    }
  }
});
function ssrRender$b(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<button${ssrRenderAttrs(mergeProps({
    class: ["pad-cell", _ctx.padClasses],
    type: "button",
    "aria-pressed": "isSelected"
  }, _attrs))} data-v-27af9f88><span class="pad-label" data-v-27af9f88>${ssrInterpolate(_ctx.label)}</span></button>`);
}
const _sfc_setup$b = _sfc_main$b.setup;
_sfc_main$b.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/PadCell.vue");
  return _sfc_setup$b ? _sfc_setup$b(props, ctx) : void 0;
};
const __nuxt_component_0$2 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$b, [["ssrRender", ssrRender$b], ["__scopeId", "data-v-27af9f88"]]), { __name: "PadCell" });
const _sfc_main$a = defineComponent({
  name: "PadGrid",
  components: { PadCell: __nuxt_component_0$2 },
  props: {
    pads: { type: Array, required: true },
    selectedPad: { type: String, default: null },
    padStates: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ["pad:down", "pad:select"],
  methods: {
    padLabel(pad) {
      return this.padStates[pad]?.label ?? pad.toUpperCase();
    }
  }
});
function ssrRender$a(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  const _component_PadCell = __nuxt_component_0$2;
  _push(`<div${ssrRenderAttrs(mergeProps({ class: "pad-grid" }, _attrs))} data-v-9685e4f8><!--[-->`);
  ssrRenderList(_ctx.pads, (pad) => {
    _push(ssrRenderComponent(_component_PadCell, {
      key: pad,
      "pad-id": pad,
      label: _ctx.padLabel(pad),
      "is-selected": _ctx.selectedPad === pad,
      "is-triggered": _ctx.padStates[pad]?.isTriggered ?? false,
      "is-playing": _ctx.padStates[pad]?.isPlaying ?? false,
      "onPad:down": ($event) => _ctx.$emit("pad:down", $event),
      "onPad:select": ($event) => _ctx.$emit("pad:select", $event)
    }, null, _parent));
  });
  _push(`<!--]--></div>`);
}
const _sfc_setup$a = _sfc_main$a.setup;
_sfc_main$a.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/PadGrid.vue");
  return _sfc_setup$a ? _sfc_setup$a(props, ctx) : void 0;
};
const __nuxt_component_1$1 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$a, [["ssrRender", ssrRender$a], ["__scopeId", "data-v-9685e4f8"]]), { __name: "PadGrid" });
const _sfc_main$9 = defineComponent({
  name: "StepCell",
  props: {
    displayLabel: { type: String, required: true },
    isActive: { type: Boolean, default: false },
    isAccent: { type: Boolean, default: false },
    isCurrent: { type: Boolean, default: false }
  },
  emits: ["cell:toggle"],
  computed: {
    cellClasses() {
      return {
        "is-active": this.isActive,
        "is-accent": this.isAccent,
        "is-current": this.isCurrent
      };
    }
  }
});
function ssrRender$9(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<button${ssrRenderAttrs(mergeProps({
    class: ["step-cell", _ctx.cellClasses],
    type: "button",
    "aria-pressed": "isActive"
  }, _attrs))} data-v-2de6ef11><span class="step-tag" data-v-2de6ef11>${ssrInterpolate(_ctx.displayLabel)}</span></button>`);
}
const _sfc_setup$9 = _sfc_main$9.setup;
_sfc_main$9.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/StepCell.vue");
  return _sfc_setup$9 ? _sfc_setup$9(props, ctx) : void 0;
};
const __nuxt_component_0$1 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$9, [["ssrRender", ssrRender$9], ["__scopeId", "data-v-2de6ef11"]]), { __name: "StepCell" });
const _sfc_main$8 = defineComponent({
  name: "PlayheadOverlay",
  props: {
    currentStep: { type: Number, required: true },
    totalSteps: { type: Number, required: true },
    isPlaying: { type: Boolean, required: true }
  },
  computed: {
    overlayStyle() {
      const cappedSteps = Math.max(this.totalSteps, 1);
      const normalizedStep = (this.currentStep % cappedSteps + cappedSteps) % cappedSteps;
      const width = 100 / cappedSteps;
      const left = normalizedStep * width;
      return {
        width: `${width}%`,
        left: `${left}%`
      };
    }
  }
});
function ssrRender$8(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  _push(`<div${ssrRenderAttrs(mergeProps({
    class: ["playhead-overlay", { "is-active": _ctx.isPlaying }],
    style: _ctx.overlayStyle
  }, _attrs))} data-v-a839da9e></div>`);
}
const _sfc_setup$8 = _sfc_main$8.setup;
_sfc_main$8.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/PlayheadOverlay.vue");
  return _sfc_setup$8 ? _sfc_setup$8(props, ctx) : void 0;
};
const __nuxt_component_1 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$8, [["ssrRender", ssrRender$8], ["__scopeId", "data-v-a839da9e"]]), { __name: "PlayheadOverlay" });
const _sfc_main$7 = defineComponent({
  name: "StepGrid",
  components: {
    StepCell: __nuxt_component_0$1,
    PlayheadOverlay: __nuxt_component_1
  },
  props: {
    gridSpec: { type: Object, required: true },
    steps: { type: Object, required: true },
    selectedPad: { type: String, default: null },
    currentStep: { type: Number, required: true },
    isPlaying: { type: Boolean, required: true }
  },
  emits: ["step:toggle"],
  computed: {
    totalSteps() {
      return this.gridSpec.bars * this.gridSpec.division;
    },
    currentStepNormalized() {
      const steps = Math.max(this.totalSteps, 1);
      return (this.currentStep % steps + steps) % steps;
    }
  },
  methods: {
    emitToggle(index2) {
      const barIndex = Math.floor(index2 / this.gridSpec.division);
      const stepInBar = index2 % this.gridSpec.division;
      if (this.selectedPad) {
        this.$emit("step:toggle", { barIndex, stepInBar, padId: this.selectedPad });
      }
    },
    velocityAt(index2) {
      if (!this.selectedPad) {
        return void 0;
      }
      const barIndex = Math.floor(index2 / this.gridSpec.division);
      const stepInBar = index2 % this.gridSpec.division;
      return this.steps[barIndex]?.[stepInBar]?.[this.selectedPad]?.velocity?.value;
    },
    isActive(index2) {
      return Boolean(this.velocityAt(index2));
    },
    isAccent(index2) {
      const velocity = this.velocityAt(index2);
      return velocity !== void 0 && velocity >= ACCENT_STEP_VELOCITY - 0.01;
    },
    isCurrent(index2) {
      return index2 === this.currentStepNormalized;
    }
  }
});
function ssrRender$7(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  const _component_StepCell = __nuxt_component_0$1;
  const _component_PlayheadOverlay = __nuxt_component_1;
  _push(`<div${ssrRenderAttrs(mergeProps({ class: "step-grid-shell" }, _attrs))} data-v-eaa17c3c><div class="step-row" data-v-eaa17c3c><!--[-->`);
  ssrRenderList(_ctx.totalSteps, (index2) => {
    _push(ssrRenderComponent(_component_StepCell, {
      key: index2,
      "display-label": String(index2),
      "is-active": _ctx.isActive(index2 - 1),
      "is-accent": _ctx.isAccent(index2 - 1),
      "is-current": _ctx.isCurrent(index2 - 1),
      "onCell:toggle": ($event) => _ctx.emitToggle(index2 - 1)
    }, null, _parent));
  });
  _push(`<!--]-->`);
  if (_ctx.totalSteps > 0) {
    _push(ssrRenderComponent(_component_PlayheadOverlay, {
      "current-step": _ctx.currentStepNormalized,
      "total-steps": _ctx.totalSteps,
      "is-playing": _ctx.isPlaying
    }, null, _parent));
  } else {
    _push(`<!---->`);
  }
  _push(`</div></div>`);
}
const _sfc_setup$7 = _sfc_main$7.setup;
_sfc_main$7.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/StepGrid.vue");
  return _sfc_setup$7 ? _sfc_setup$7(props, ctx) : void 0;
};
const __nuxt_component_2 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$7, [["ssrRender", ssrRender$7], ["__scopeId", "data-v-eaa17c3c"]]), { __name: "StepGrid" });
const tabs = [
  { label: "Sound", value: "sound" },
  { label: "FX", value: "fx" },
  { label: "Patterns", value: "patterns" },
  { label: "Export", value: "export" }
];
const _sfc_main$6 = defineComponent({
  name: "TabPanel",
  props: {
    modelValue: { type: String, default: "sound" }
  },
  emits: ["update:modelValue"],
  computed: {
    internalTab: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit("update:modelValue", value);
      }
    },
    tabs() {
      return tabs;
    }
  }
});
function ssrRender$6(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  const _component_v_tabs = resolveComponent("v-tabs");
  const _component_v_tab = resolveComponent("v-tab");
  const _component_v_tabs_window = resolveComponent("v-tabs-window");
  const _component_v_tabs_window_item = resolveComponent("v-tabs-window-item");
  _push(`<div${ssrRenderAttrs(mergeProps({ class: "drawer-shell" }, _attrs))} data-v-2166decf>`);
  _push(ssrRenderComponent(_component_v_tabs, {
    class: "drawer-tabs",
    modelValue: _ctx.internalTab,
    "onUpdate:modelValue": ($event) => _ctx.internalTab = $event,
    density: "comfortable",
    variant: "text"
  }, {
    default: withCtx((_, _push2, _parent2, _scopeId) => {
      if (_push2) {
        _push2(`<!--[-->`);
        ssrRenderList(_ctx.tabs, (tab) => {
          _push2(ssrRenderComponent(_component_v_tab, {
            key: tab.value,
            value: tab.value
          }, {
            default: withCtx((_2, _push3, _parent3, _scopeId2) => {
              if (_push3) {
                _push3(`${ssrInterpolate(tab.label)}`);
              } else {
                return [
                  createTextVNode(toDisplayString(tab.label), 1)
                ];
              }
            }),
            _: 2
          }, _parent2, _scopeId));
        });
        _push2(`<!--]-->`);
      } else {
        return [
          (openBlock(true), createBlock(Fragment, null, renderList(_ctx.tabs, (tab) => {
            return openBlock(), createBlock(_component_v_tab, {
              key: tab.value,
              value: tab.value
            }, {
              default: withCtx(() => [
                createTextVNode(toDisplayString(tab.label), 1)
              ]),
              _: 2
            }, 1032, ["value"]);
          }), 128))
        ];
      }
    }),
    _: 1
  }, _parent));
  _push(ssrRenderComponent(_component_v_tabs_window, {
    class: "drawer-window",
    modelValue: _ctx.internalTab,
    "onUpdate:modelValue": ($event) => _ctx.internalTab = $event
  }, {
    default: withCtx((_, _push2, _parent2, _scopeId) => {
      if (_push2) {
        _push2(ssrRenderComponent(_component_v_tabs_window_item, { value: "sound" }, {
          default: withCtx((_2, _push3, _parent3, _scopeId2) => {
            if (_push3) {
              ssrRenderSlot(_ctx.$slots, "sound", {}, null, _push3, _parent3, _scopeId2);
            } else {
              return [
                renderSlot(_ctx.$slots, "sound", {}, void 0, true)
              ];
            }
          }),
          _: 3
        }, _parent2, _scopeId));
        _push2(ssrRenderComponent(_component_v_tabs_window_item, { value: "fx" }, {
          default: withCtx((_2, _push3, _parent3, _scopeId2) => {
            if (_push3) {
              ssrRenderSlot(_ctx.$slots, "fx", {}, null, _push3, _parent3, _scopeId2);
            } else {
              return [
                renderSlot(_ctx.$slots, "fx", {}, void 0, true)
              ];
            }
          }),
          _: 3
        }, _parent2, _scopeId));
        _push2(ssrRenderComponent(_component_v_tabs_window_item, { value: "patterns" }, {
          default: withCtx((_2, _push3, _parent3, _scopeId2) => {
            if (_push3) {
              ssrRenderSlot(_ctx.$slots, "patterns", {}, null, _push3, _parent3, _scopeId2);
            } else {
              return [
                renderSlot(_ctx.$slots, "patterns", {}, void 0, true)
              ];
            }
          }),
          _: 3
        }, _parent2, _scopeId));
        _push2(ssrRenderComponent(_component_v_tabs_window_item, { value: "export" }, {
          default: withCtx((_2, _push3, _parent3, _scopeId2) => {
            if (_push3) {
              ssrRenderSlot(_ctx.$slots, "export", {}, null, _push3, _parent3, _scopeId2);
            } else {
              return [
                renderSlot(_ctx.$slots, "export", {}, void 0, true)
              ];
            }
          }),
          _: 3
        }, _parent2, _scopeId));
      } else {
        return [
          createVNode(_component_v_tabs_window_item, { value: "sound" }, {
            default: withCtx(() => [
              renderSlot(_ctx.$slots, "sound", {}, void 0, true)
            ]),
            _: 3
          }),
          createVNode(_component_v_tabs_window_item, { value: "fx" }, {
            default: withCtx(() => [
              renderSlot(_ctx.$slots, "fx", {}, void 0, true)
            ]),
            _: 3
          }),
          createVNode(_component_v_tabs_window_item, { value: "patterns" }, {
            default: withCtx(() => [
              renderSlot(_ctx.$slots, "patterns", {}, void 0, true)
            ]),
            _: 3
          }),
          createVNode(_component_v_tabs_window_item, { value: "export" }, {
            default: withCtx(() => [
              renderSlot(_ctx.$slots, "export", {}, void 0, true)
            ]),
            _: 3
          })
        ];
      }
    }),
    _: 3
  }, _parent));
  _push(`</div>`);
}
const _sfc_setup$6 = _sfc_main$6.setup;
_sfc_main$6.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/TabPanel.vue");
  return _sfc_setup$6 ? _sfc_setup$6(props, ctx) : void 0;
};
const TabPanel = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$6, [["ssrRender", ssrRender$6], ["__scopeId", "data-v-2166decf"]]), { __name: "TabPanel" });
const _sfc_main$5 = defineComponent({
  name: "SoundPanel",
  props: {
    banks: { type: Array, required: true },
    selectedBankId: { type: String, default: null }
  },
  emits: ["bank:select", "pad:replace"],
  data() {
    return {
      padTarget: "pad1"
    };
  },
  computed: {
    bankItems() {
      return this.banks.map((bank) => ({ title: bank.name, value: bank.id }));
    },
    padItems() {
      return Array.from({ length: 16 }, (_, index2) => {
        const id = `pad${index2 + 1}`;
        return { title: id.toUpperCase(), value: id };
      });
    },
    currentSampleLabel() {
      const bank = this.banks.find((entry) => entry.id === this.selectedBankId);
      const sample = bank?.pads?.[this.padTarget];
      return sample?.name ?? "Default";
    }
  },
  methods: {
    selectBank(value) {
      this.$emit("bank:select", value);
    },
    triggerFile() {
      const input = this.$refs.fileInput;
      input?.click();
    },
    onFileChange(event) {
      const input = event.target;
      const files = input?.files;
      if (!files || files.length === 0) return;
      const file = files[0];
      this.$emit("pad:replace", { padId: this.padTarget, file });
      if (input) {
        input.value = "";
      }
    }
  }
});
function ssrRender$5(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  const _component_v_select = resolveComponent("v-select");
  const _component_v_btn = resolveComponent("v-btn");
  _push(`<div${ssrRenderAttrs(mergeProps({ class: "panel-shell" }, _attrs))} data-v-6f113482><div class="panel-header" data-v-6f113482>Sound</div><div class="panel-body" data-v-6f113482>`);
  _push(ssrRenderComponent(_component_v_select, {
    label: "Bank",
    dense: "",
    items: _ctx.bankItems,
    "item-title": "title",
    "item-value": "value",
    "model-value": _ctx.selectedBankId,
    "onUpdate:modelValue": _ctx.selectBank,
    "hide-details": ""
  }, null, _parent));
  _push(ssrRenderComponent(_component_v_select, {
    label: "Pad",
    dense: "",
    items: _ctx.padItems,
    "item-title": "title",
    "item-value": "value",
    modelValue: _ctx.padTarget,
    "onUpdate:modelValue": ($event) => _ctx.padTarget = $event,
    "hide-details": ""
  }, null, _parent));
  _push(`<p class="current-sample" data-v-6f113482>Label: ${ssrInterpolate(_ctx.currentSampleLabel)}</p><input class="d-none" type="file" accept="audio/*" data-v-6f113482>`);
  _push(ssrRenderComponent(_component_v_btn, {
    class: "mt-3",
    color: "primary",
    block: "",
    onClick: _ctx.triggerFile
  }, {
    default: withCtx((_, _push2, _parent2, _scopeId) => {
      if (_push2) {
        _push2(`Replace sample`);
      } else {
        return [
          createTextVNode("Replace sample")
        ];
      }
    }),
    _: 1
  }, _parent));
  _push(`</div></div>`);
}
const _sfc_setup$5 = _sfc_main$5.setup;
_sfc_main$5.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/panels/SoundPanel.vue");
  return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
const SoundPanel = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$5, [["ssrRender", ssrRender$5], ["__scopeId", "data-v-6f113482"]]), { __name: "PanelsSoundPanel" });
const _sfc_main$4 = defineComponent({
  name: "FxPanel",
  props: {
    fxSettings: { type: Object, required: true }
  },
  emits: ["fx:update"],
  data() {
    return {
      activeSlot: "filter",
      localFx: { ...this.fxSettings }
    };
  },
  watch: {
    fxSettings: {
      deep: true,
      handler(value) {
        this.localFx = {
          ...value,
          filter: { ...value.filter },
          drive: { ...value.drive },
          reverb: { ...value.reverb }
        };
      }
    }
  },
  methods: {
    emitFx() {
      this.$emit("fx:update", {
        filter: { ...this.localFx.filter },
        drive: { ...this.localFx.drive },
        reverb: { ...this.localFx.reverb }
      });
    },
    toggleFilter(enabled) {
      this.localFx.filter.enabled = enabled;
      this.emitFx();
    },
    setFilterFreq(value) {
      this.localFx.filter.frequency = value;
      this.emitFx();
    },
    setFilterQ(value) {
      this.localFx.filter.q = value;
      this.emitFx();
    },
    toggleDrive(enabled) {
      this.localFx.drive.enabled = enabled;
      this.emitFx();
    },
    setDriveAmount(value) {
      this.localFx.drive.amount = value;
      this.emitFx();
    },
    toggleReverb(enabled) {
      this.localFx.reverb.enabled = enabled;
      this.emitFx();
    },
    setReverbMix(value) {
      this.localFx.reverb.mix = value;
      this.emitFx();
    }
  }
});
function ssrRender$4(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  const _component_v_expansion_panels = resolveComponent("v-expansion-panels");
  const _component_v_expansion_panel = resolveComponent("v-expansion-panel");
  const _component_v_expansion_panel_title = resolveComponent("v-expansion-panel-title");
  const _component_v_expansion_panel_text = resolveComponent("v-expansion-panel-text");
  const _component_v_switch = resolveComponent("v-switch");
  const _component_v_slider = resolveComponent("v-slider");
  _push(`<div${ssrRenderAttrs(mergeProps({ class: "panel-shell" }, _attrs))} data-v-54c0e84f><div class="panel-header" data-v-54c0e84f>FX</div>`);
  _push(ssrRenderComponent(_component_v_expansion_panels, {
    class: "fx-panels",
    modelValue: _ctx.activeSlot,
    "onUpdate:modelValue": ($event) => _ctx.activeSlot = $event,
    accordion: ""
  }, {
    default: withCtx((_, _push2, _parent2, _scopeId) => {
      if (_push2) {
        _push2(ssrRenderComponent(_component_v_expansion_panel, { value: "filter" }, {
          default: withCtx((_2, _push3, _parent3, _scopeId2) => {
            if (_push3) {
              _push3(ssrRenderComponent(_component_v_expansion_panel_title, null, {
                default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                  if (_push4) {
                    _push4(`Filter`);
                  } else {
                    return [
                      createTextVNode("Filter")
                    ];
                  }
                }),
                _: 1
              }, _parent3, _scopeId2));
              _push3(ssrRenderComponent(_component_v_expansion_panel_text, null, {
                default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                  if (_push4) {
                    _push4(ssrRenderComponent(_component_v_switch, {
                      label: "Enabled",
                      dense: "",
                      "model-value": _ctx.localFx.filter.enabled,
                      "onUpdate:modelValue": _ctx.toggleFilter
                    }, null, _parent4, _scopeId3));
                    if (_ctx.localFx.filter.enabled) {
                      _push4(ssrRenderComponent(_component_v_slider, {
                        dense: "",
                        label: "Cutoff",
                        "hide-details": "",
                        min: "200",
                        max: "18000",
                        step: "50",
                        "thumb-label": "",
                        "model-value": _ctx.localFx.filter.frequency,
                        "onUpdate:modelValue": _ctx.setFilterFreq
                      }, null, _parent4, _scopeId3));
                    } else {
                      _push4(`<!---->`);
                    }
                    if (_ctx.localFx.filter.enabled) {
                      _push4(ssrRenderComponent(_component_v_slider, {
                        dense: "",
                        label: "Resonance (Q)",
                        "hide-details": "",
                        min: "0.1",
                        max: "12",
                        step: "0.1",
                        "thumb-label": "",
                        "model-value": _ctx.localFx.filter.q,
                        "onUpdate:modelValue": _ctx.setFilterQ
                      }, null, _parent4, _scopeId3));
                    } else {
                      _push4(`<!---->`);
                    }
                  } else {
                    return [
                      createVNode(_component_v_switch, {
                        label: "Enabled",
                        dense: "",
                        "model-value": _ctx.localFx.filter.enabled,
                        "onUpdate:modelValue": _ctx.toggleFilter
                      }, null, 8, ["model-value", "onUpdate:modelValue"]),
                      _ctx.localFx.filter.enabled ? (openBlock(), createBlock(_component_v_slider, {
                        key: 0,
                        dense: "",
                        label: "Cutoff",
                        "hide-details": "",
                        min: "200",
                        max: "18000",
                        step: "50",
                        "thumb-label": "",
                        "model-value": _ctx.localFx.filter.frequency,
                        "onUpdate:modelValue": _ctx.setFilterFreq
                      }, null, 8, ["model-value", "onUpdate:modelValue"])) : createCommentVNode("", true),
                      _ctx.localFx.filter.enabled ? (openBlock(), createBlock(_component_v_slider, {
                        key: 1,
                        dense: "",
                        label: "Resonance (Q)",
                        "hide-details": "",
                        min: "0.1",
                        max: "12",
                        step: "0.1",
                        "thumb-label": "",
                        "model-value": _ctx.localFx.filter.q,
                        "onUpdate:modelValue": _ctx.setFilterQ
                      }, null, 8, ["model-value", "onUpdate:modelValue"])) : createCommentVNode("", true)
                    ];
                  }
                }),
                _: 1
              }, _parent3, _scopeId2));
            } else {
              return [
                createVNode(_component_v_expansion_panel_title, null, {
                  default: withCtx(() => [
                    createTextVNode("Filter")
                  ]),
                  _: 1
                }),
                createVNode(_component_v_expansion_panel_text, null, {
                  default: withCtx(() => [
                    createVNode(_component_v_switch, {
                      label: "Enabled",
                      dense: "",
                      "model-value": _ctx.localFx.filter.enabled,
                      "onUpdate:modelValue": _ctx.toggleFilter
                    }, null, 8, ["model-value", "onUpdate:modelValue"]),
                    _ctx.localFx.filter.enabled ? (openBlock(), createBlock(_component_v_slider, {
                      key: 0,
                      dense: "",
                      label: "Cutoff",
                      "hide-details": "",
                      min: "200",
                      max: "18000",
                      step: "50",
                      "thumb-label": "",
                      "model-value": _ctx.localFx.filter.frequency,
                      "onUpdate:modelValue": _ctx.setFilterFreq
                    }, null, 8, ["model-value", "onUpdate:modelValue"])) : createCommentVNode("", true),
                    _ctx.localFx.filter.enabled ? (openBlock(), createBlock(_component_v_slider, {
                      key: 1,
                      dense: "",
                      label: "Resonance (Q)",
                      "hide-details": "",
                      min: "0.1",
                      max: "12",
                      step: "0.1",
                      "thumb-label": "",
                      "model-value": _ctx.localFx.filter.q,
                      "onUpdate:modelValue": _ctx.setFilterQ
                    }, null, 8, ["model-value", "onUpdate:modelValue"])) : createCommentVNode("", true)
                  ]),
                  _: 1
                })
              ];
            }
          }),
          _: 1
        }, _parent2, _scopeId));
        _push2(ssrRenderComponent(_component_v_expansion_panel, { value: "drive" }, {
          default: withCtx((_2, _push3, _parent3, _scopeId2) => {
            if (_push3) {
              _push3(ssrRenderComponent(_component_v_expansion_panel_title, null, {
                default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                  if (_push4) {
                    _push4(`Drive`);
                  } else {
                    return [
                      createTextVNode("Drive")
                    ];
                  }
                }),
                _: 1
              }, _parent3, _scopeId2));
              _push3(ssrRenderComponent(_component_v_expansion_panel_text, null, {
                default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                  if (_push4) {
                    _push4(ssrRenderComponent(_component_v_switch, {
                      label: "Enabled",
                      dense: "",
                      "model-value": _ctx.localFx.drive.enabled,
                      "onUpdate:modelValue": _ctx.toggleDrive
                    }, null, _parent4, _scopeId3));
                    if (_ctx.localFx.drive.enabled) {
                      _push4(ssrRenderComponent(_component_v_slider, {
                        dense: "",
                        label: "Amount",
                        "hide-details": "",
                        min: "0",
                        max: "1",
                        step: "0.05",
                        "thumb-label": "",
                        "model-value": _ctx.localFx.drive.amount,
                        "onUpdate:modelValue": _ctx.setDriveAmount
                      }, null, _parent4, _scopeId3));
                    } else {
                      _push4(`<!---->`);
                    }
                  } else {
                    return [
                      createVNode(_component_v_switch, {
                        label: "Enabled",
                        dense: "",
                        "model-value": _ctx.localFx.drive.enabled,
                        "onUpdate:modelValue": _ctx.toggleDrive
                      }, null, 8, ["model-value", "onUpdate:modelValue"]),
                      _ctx.localFx.drive.enabled ? (openBlock(), createBlock(_component_v_slider, {
                        key: 0,
                        dense: "",
                        label: "Amount",
                        "hide-details": "",
                        min: "0",
                        max: "1",
                        step: "0.05",
                        "thumb-label": "",
                        "model-value": _ctx.localFx.drive.amount,
                        "onUpdate:modelValue": _ctx.setDriveAmount
                      }, null, 8, ["model-value", "onUpdate:modelValue"])) : createCommentVNode("", true)
                    ];
                  }
                }),
                _: 1
              }, _parent3, _scopeId2));
            } else {
              return [
                createVNode(_component_v_expansion_panel_title, null, {
                  default: withCtx(() => [
                    createTextVNode("Drive")
                  ]),
                  _: 1
                }),
                createVNode(_component_v_expansion_panel_text, null, {
                  default: withCtx(() => [
                    createVNode(_component_v_switch, {
                      label: "Enabled",
                      dense: "",
                      "model-value": _ctx.localFx.drive.enabled,
                      "onUpdate:modelValue": _ctx.toggleDrive
                    }, null, 8, ["model-value", "onUpdate:modelValue"]),
                    _ctx.localFx.drive.enabled ? (openBlock(), createBlock(_component_v_slider, {
                      key: 0,
                      dense: "",
                      label: "Amount",
                      "hide-details": "",
                      min: "0",
                      max: "1",
                      step: "0.05",
                      "thumb-label": "",
                      "model-value": _ctx.localFx.drive.amount,
                      "onUpdate:modelValue": _ctx.setDriveAmount
                    }, null, 8, ["model-value", "onUpdate:modelValue"])) : createCommentVNode("", true)
                  ]),
                  _: 1
                })
              ];
            }
          }),
          _: 1
        }, _parent2, _scopeId));
        _push2(ssrRenderComponent(_component_v_expansion_panel, { value: "reverb" }, {
          default: withCtx((_2, _push3, _parent3, _scopeId2) => {
            if (_push3) {
              _push3(ssrRenderComponent(_component_v_expansion_panel_title, null, {
                default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                  if (_push4) {
                    _push4(`Reverb`);
                  } else {
                    return [
                      createTextVNode("Reverb")
                    ];
                  }
                }),
                _: 1
              }, _parent3, _scopeId2));
              _push3(ssrRenderComponent(_component_v_expansion_panel_text, null, {
                default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                  if (_push4) {
                    _push4(ssrRenderComponent(_component_v_switch, {
                      label: "Enabled",
                      dense: "",
                      "model-value": _ctx.localFx.reverb.enabled,
                      "onUpdate:modelValue": _ctx.toggleReverb
                    }, null, _parent4, _scopeId3));
                    if (_ctx.localFx.reverb.enabled) {
                      _push4(ssrRenderComponent(_component_v_slider, {
                        dense: "",
                        label: "Mix",
                        "hide-details": "",
                        min: "0",
                        max: "0.6",
                        step: "0.02",
                        "thumb-label": "",
                        "model-value": _ctx.localFx.reverb.mix,
                        "onUpdate:modelValue": _ctx.setReverbMix
                      }, null, _parent4, _scopeId3));
                    } else {
                      _push4(`<!---->`);
                    }
                  } else {
                    return [
                      createVNode(_component_v_switch, {
                        label: "Enabled",
                        dense: "",
                        "model-value": _ctx.localFx.reverb.enabled,
                        "onUpdate:modelValue": _ctx.toggleReverb
                      }, null, 8, ["model-value", "onUpdate:modelValue"]),
                      _ctx.localFx.reverb.enabled ? (openBlock(), createBlock(_component_v_slider, {
                        key: 0,
                        dense: "",
                        label: "Mix",
                        "hide-details": "",
                        min: "0",
                        max: "0.6",
                        step: "0.02",
                        "thumb-label": "",
                        "model-value": _ctx.localFx.reverb.mix,
                        "onUpdate:modelValue": _ctx.setReverbMix
                      }, null, 8, ["model-value", "onUpdate:modelValue"])) : createCommentVNode("", true)
                    ];
                  }
                }),
                _: 1
              }, _parent3, _scopeId2));
            } else {
              return [
                createVNode(_component_v_expansion_panel_title, null, {
                  default: withCtx(() => [
                    createTextVNode("Reverb")
                  ]),
                  _: 1
                }),
                createVNode(_component_v_expansion_panel_text, null, {
                  default: withCtx(() => [
                    createVNode(_component_v_switch, {
                      label: "Enabled",
                      dense: "",
                      "model-value": _ctx.localFx.reverb.enabled,
                      "onUpdate:modelValue": _ctx.toggleReverb
                    }, null, 8, ["model-value", "onUpdate:modelValue"]),
                    _ctx.localFx.reverb.enabled ? (openBlock(), createBlock(_component_v_slider, {
                      key: 0,
                      dense: "",
                      label: "Mix",
                      "hide-details": "",
                      min: "0",
                      max: "0.6",
                      step: "0.02",
                      "thumb-label": "",
                      "model-value": _ctx.localFx.reverb.mix,
                      "onUpdate:modelValue": _ctx.setReverbMix
                    }, null, 8, ["model-value", "onUpdate:modelValue"])) : createCommentVNode("", true)
                  ]),
                  _: 1
                })
              ];
            }
          }),
          _: 1
        }, _parent2, _scopeId));
        _push2(ssrRenderComponent(_component_v_expansion_panel, { value: "routing" }, {
          default: withCtx((_2, _push3, _parent3, _scopeId2) => {
            if (_push3) {
              _push3(ssrRenderComponent(_component_v_expansion_panel_title, null, {
                default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                  if (_push4) {
                    _push4(`Routing`);
                  } else {
                    return [
                      createTextVNode("Routing")
                    ];
                  }
                }),
                _: 1
              }, _parent3, _scopeId2));
              _push3(ssrRenderComponent(_component_v_expansion_panel_text, null, {
                default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                  if (_push4) {
                    _push4(`<p data-v-54c0e84f${_scopeId3}>Subtle master shaping slot. No additional controls yet.</p>`);
                  } else {
                    return [
                      createVNode("p", null, "Subtle master shaping slot. No additional controls yet.")
                    ];
                  }
                }),
                _: 1
              }, _parent3, _scopeId2));
            } else {
              return [
                createVNode(_component_v_expansion_panel_title, null, {
                  default: withCtx(() => [
                    createTextVNode("Routing")
                  ]),
                  _: 1
                }),
                createVNode(_component_v_expansion_panel_text, null, {
                  default: withCtx(() => [
                    createVNode("p", null, "Subtle master shaping slot. No additional controls yet.")
                  ]),
                  _: 1
                })
              ];
            }
          }),
          _: 1
        }, _parent2, _scopeId));
      } else {
        return [
          createVNode(_component_v_expansion_panel, { value: "filter" }, {
            default: withCtx(() => [
              createVNode(_component_v_expansion_panel_title, null, {
                default: withCtx(() => [
                  createTextVNode("Filter")
                ]),
                _: 1
              }),
              createVNode(_component_v_expansion_panel_text, null, {
                default: withCtx(() => [
                  createVNode(_component_v_switch, {
                    label: "Enabled",
                    dense: "",
                    "model-value": _ctx.localFx.filter.enabled,
                    "onUpdate:modelValue": _ctx.toggleFilter
                  }, null, 8, ["model-value", "onUpdate:modelValue"]),
                  _ctx.localFx.filter.enabled ? (openBlock(), createBlock(_component_v_slider, {
                    key: 0,
                    dense: "",
                    label: "Cutoff",
                    "hide-details": "",
                    min: "200",
                    max: "18000",
                    step: "50",
                    "thumb-label": "",
                    "model-value": _ctx.localFx.filter.frequency,
                    "onUpdate:modelValue": _ctx.setFilterFreq
                  }, null, 8, ["model-value", "onUpdate:modelValue"])) : createCommentVNode("", true),
                  _ctx.localFx.filter.enabled ? (openBlock(), createBlock(_component_v_slider, {
                    key: 1,
                    dense: "",
                    label: "Resonance (Q)",
                    "hide-details": "",
                    min: "0.1",
                    max: "12",
                    step: "0.1",
                    "thumb-label": "",
                    "model-value": _ctx.localFx.filter.q,
                    "onUpdate:modelValue": _ctx.setFilterQ
                  }, null, 8, ["model-value", "onUpdate:modelValue"])) : createCommentVNode("", true)
                ]),
                _: 1
              })
            ]),
            _: 1
          }),
          createVNode(_component_v_expansion_panel, { value: "drive" }, {
            default: withCtx(() => [
              createVNode(_component_v_expansion_panel_title, null, {
                default: withCtx(() => [
                  createTextVNode("Drive")
                ]),
                _: 1
              }),
              createVNode(_component_v_expansion_panel_text, null, {
                default: withCtx(() => [
                  createVNode(_component_v_switch, {
                    label: "Enabled",
                    dense: "",
                    "model-value": _ctx.localFx.drive.enabled,
                    "onUpdate:modelValue": _ctx.toggleDrive
                  }, null, 8, ["model-value", "onUpdate:modelValue"]),
                  _ctx.localFx.drive.enabled ? (openBlock(), createBlock(_component_v_slider, {
                    key: 0,
                    dense: "",
                    label: "Amount",
                    "hide-details": "",
                    min: "0",
                    max: "1",
                    step: "0.05",
                    "thumb-label": "",
                    "model-value": _ctx.localFx.drive.amount,
                    "onUpdate:modelValue": _ctx.setDriveAmount
                  }, null, 8, ["model-value", "onUpdate:modelValue"])) : createCommentVNode("", true)
                ]),
                _: 1
              })
            ]),
            _: 1
          }),
          createVNode(_component_v_expansion_panel, { value: "reverb" }, {
            default: withCtx(() => [
              createVNode(_component_v_expansion_panel_title, null, {
                default: withCtx(() => [
                  createTextVNode("Reverb")
                ]),
                _: 1
              }),
              createVNode(_component_v_expansion_panel_text, null, {
                default: withCtx(() => [
                  createVNode(_component_v_switch, {
                    label: "Enabled",
                    dense: "",
                    "model-value": _ctx.localFx.reverb.enabled,
                    "onUpdate:modelValue": _ctx.toggleReverb
                  }, null, 8, ["model-value", "onUpdate:modelValue"]),
                  _ctx.localFx.reverb.enabled ? (openBlock(), createBlock(_component_v_slider, {
                    key: 0,
                    dense: "",
                    label: "Mix",
                    "hide-details": "",
                    min: "0",
                    max: "0.6",
                    step: "0.02",
                    "thumb-label": "",
                    "model-value": _ctx.localFx.reverb.mix,
                    "onUpdate:modelValue": _ctx.setReverbMix
                  }, null, 8, ["model-value", "onUpdate:modelValue"])) : createCommentVNode("", true)
                ]),
                _: 1
              })
            ]),
            _: 1
          }),
          createVNode(_component_v_expansion_panel, { value: "routing" }, {
            default: withCtx(() => [
              createVNode(_component_v_expansion_panel_title, null, {
                default: withCtx(() => [
                  createTextVNode("Routing")
                ]),
                _: 1
              }),
              createVNode(_component_v_expansion_panel_text, null, {
                default: withCtx(() => [
                  createVNode("p", null, "Subtle master shaping slot. No additional controls yet.")
                ]),
                _: 1
              })
            ]),
            _: 1
          })
        ];
      }
    }),
    _: 1
  }, _parent));
  _push(`</div>`);
}
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/panels/FxPanel.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const FxPanel = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$4, [["ssrRender", ssrRender$4], ["__scopeId", "data-v-54c0e84f"]]), { __name: "PanelsFxPanel" });
const _sfc_main$3 = defineComponent({
  name: "PatternsPanel",
  props: {
    patterns: { type: Array, required: true },
    selectedPatternId: { type: String, required: false },
    scenes: { type: Array, required: true },
    activeSceneId: { type: String, default: null }
  },
  emits: ["pattern:add", "pattern:select", "pattern:rename", "pattern:undo", "pattern:redo", "scene:add", "scene:update", "scene:select"],
  data() {
    return {
      newPatternName: "",
      renameValue: "",
      sceneName: "",
      scenePatternIds: []
    };
  },
  computed: {
    patternItems() {
      return this.patterns.map((pattern) => ({ title: pattern.name, value: pattern.id }));
    },
    sceneItems() {
      return [{ title: "None", value: null }, ...this.scenes.map((scene) => ({ title: scene.name, value: scene.id }))];
    },
    currentScene() {
      return this.scenes.find((scene) => scene.id === this.activeSceneId) ?? null;
    },
    currentPattern() {
      return this.patterns.find((pattern) => pattern.id === this.selectedPatternId) ?? null;
    }
  },
  watch: {
    currentScene: {
      immediate: true,
      handler(scene) {
        this.sceneName = scene?.name ?? "";
        this.scenePatternIds = [...scene?.patternIds ?? []];
      }
    },
    currentPattern: {
      immediate: true,
      handler(pattern) {
        this.renameValue = pattern?.name ?? "";
      }
    }
  },
  methods: {
    addPattern() {
      this.$emit("pattern:add", { name: this.newPatternName.trim() || void 0 });
      this.newPatternName = "";
    },
    handlePatternSelect(id) {
      if (id) this.$emit("pattern:select", id);
    },
    emitPatternUndo() {
      this.$emit("pattern:undo");
    },
    emitPatternRedo() {
      this.$emit("pattern:redo");
    },
    updateRenameValue(value) {
      this.renameValue = value;
    },
    setNewPatternName(value) {
      this.newPatternName = value;
    },
    submitRename() {
      if (this.currentPattern && this.renameValue.trim().length > 0) {
        this.$emit("pattern:rename", { id: this.currentPattern.id, name: this.renameValue.trim() });
      }
    },
    selectScene(id) {
      this.$emit("scene:select", id);
    },
    updateSceneName(value) {
      this.sceneName = value;
      this.emitSceneUpdate();
    },
    setScenePatternIds(value) {
      this.scenePatternIds = value;
      this.emitSceneUpdate();
    },
    emitSceneUpdate() {
      if (this.currentScene) {
        this.$emit("scene:update", {
          id: this.currentScene.id,
          name: this.sceneName.trim() || this.currentScene.name,
          patternIds: this.scenePatternIds
        });
      }
    },
    addScene() {
      this.$emit("scene:add", { name: this.sceneName.trim() || "Scene", patternIds: this.scenePatternIds });
    }
  }
});
function ssrRender$3(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  const _component_v_row = resolveComponent("v-row");
  const _component_v_col = resolveComponent("v-col");
  const _component_v_select = resolveComponent("v-select");
  const _component_v_text_field = resolveComponent("v-text-field");
  const _component_v_btn = resolveComponent("v-btn");
  const _component_v_combobox = resolveComponent("v-combobox");
  _push(`<div${ssrRenderAttrs(mergeProps({ class: "panel-shell" }, _attrs))} data-v-8034c803><div class="panel-header" data-v-8034c803>Patterns</div><div class="panel-body" data-v-8034c803>`);
  _push(ssrRenderComponent(_component_v_row, null, {
    default: withCtx((_, _push2, _parent2, _scopeId) => {
      if (_push2) {
        _push2(ssrRenderComponent(_component_v_col, {
          cols: "12",
          md: "6"
        }, {
          default: withCtx((_2, _push3, _parent3, _scopeId2) => {
            if (_push3) {
              _push3(ssrRenderComponent(_component_v_select, {
                label: "Current Pattern",
                dense: "",
                items: _ctx.patternItems,
                "item-title": "title",
                "item-value": "value",
                "model-value": _ctx.selectedPatternId,
                "onUpdate:modelValue": _ctx.handlePatternSelect,
                "hide-details": ""
              }, null, _parent3, _scopeId2));
              _push3(ssrRenderComponent(_component_v_text_field, {
                label: "Rename Pattern",
                dense: "",
                "model-value": _ctx.renameValue,
                placeholder: _ctx.currentPattern?.name || "Pattern",
                "onUpdate:modelValue": _ctx.updateRenameValue,
                onChange: _ctx.submitRename,
                "hide-details": ""
              }, null, _parent3, _scopeId2));
              _push3(ssrRenderComponent(_component_v_text_field, {
                label: "New Pattern Name",
                dense: "",
                "model-value": _ctx.newPatternName,
                "onUpdate:modelValue": _ctx.setNewPatternName,
                "hide-details": ""
              }, null, _parent3, _scopeId2));
              _push3(ssrRenderComponent(_component_v_btn, {
                class: "mt-1",
                color: "primary",
                block: "",
                onClick: _ctx.addPattern
              }, {
                default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                  if (_push4) {
                    _push4(`Add Pattern`);
                  } else {
                    return [
                      createTextVNode("Add Pattern")
                    ];
                  }
                }),
                _: 1
              }, _parent3, _scopeId2));
              _push3(ssrRenderComponent(_component_v_row, {
                class: "mt-2",
                dense: ""
              }, {
                default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                  if (_push4) {
                    _push4(ssrRenderComponent(_component_v_col, { cols: "6" }, {
                      default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                        if (_push5) {
                          _push5(ssrRenderComponent(_component_v_btn, {
                            color: "secondary",
                            block: "",
                            onClick: _ctx.emitPatternUndo
                          }, {
                            default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                              if (_push6) {
                                _push6(`Undo`);
                              } else {
                                return [
                                  createTextVNode("Undo")
                                ];
                              }
                            }),
                            _: 1
                          }, _parent5, _scopeId4));
                        } else {
                          return [
                            createVNode(_component_v_btn, {
                              color: "secondary",
                              block: "",
                              onClick: _ctx.emitPatternUndo
                            }, {
                              default: withCtx(() => [
                                createTextVNode("Undo")
                              ]),
                              _: 1
                            }, 8, ["onClick"])
                          ];
                        }
                      }),
                      _: 1
                    }, _parent4, _scopeId3));
                    _push4(ssrRenderComponent(_component_v_col, { cols: "6" }, {
                      default: withCtx((_4, _push5, _parent5, _scopeId4) => {
                        if (_push5) {
                          _push5(ssrRenderComponent(_component_v_btn, {
                            color: "secondary",
                            block: "",
                            variant: "outlined",
                            onClick: _ctx.emitPatternRedo
                          }, {
                            default: withCtx((_5, _push6, _parent6, _scopeId5) => {
                              if (_push6) {
                                _push6(`Redo`);
                              } else {
                                return [
                                  createTextVNode("Redo")
                                ];
                              }
                            }),
                            _: 1
                          }, _parent5, _scopeId4));
                        } else {
                          return [
                            createVNode(_component_v_btn, {
                              color: "secondary",
                              block: "",
                              variant: "outlined",
                              onClick: _ctx.emitPatternRedo
                            }, {
                              default: withCtx(() => [
                                createTextVNode("Redo")
                              ]),
                              _: 1
                            }, 8, ["onClick"])
                          ];
                        }
                      }),
                      _: 1
                    }, _parent4, _scopeId3));
                  } else {
                    return [
                      createVNode(_component_v_col, { cols: "6" }, {
                        default: withCtx(() => [
                          createVNode(_component_v_btn, {
                            color: "secondary",
                            block: "",
                            onClick: _ctx.emitPatternUndo
                          }, {
                            default: withCtx(() => [
                              createTextVNode("Undo")
                            ]),
                            _: 1
                          }, 8, ["onClick"])
                        ]),
                        _: 1
                      }),
                      createVNode(_component_v_col, { cols: "6" }, {
                        default: withCtx(() => [
                          createVNode(_component_v_btn, {
                            color: "secondary",
                            block: "",
                            variant: "outlined",
                            onClick: _ctx.emitPatternRedo
                          }, {
                            default: withCtx(() => [
                              createTextVNode("Redo")
                            ]),
                            _: 1
                          }, 8, ["onClick"])
                        ]),
                        _: 1
                      })
                    ];
                  }
                }),
                _: 1
              }, _parent3, _scopeId2));
            } else {
              return [
                createVNode(_component_v_select, {
                  label: "Current Pattern",
                  dense: "",
                  items: _ctx.patternItems,
                  "item-title": "title",
                  "item-value": "value",
                  "model-value": _ctx.selectedPatternId,
                  "onUpdate:modelValue": _ctx.handlePatternSelect,
                  "hide-details": ""
                }, null, 8, ["items", "model-value", "onUpdate:modelValue"]),
                createVNode(_component_v_text_field, {
                  label: "Rename Pattern",
                  dense: "",
                  "model-value": _ctx.renameValue,
                  placeholder: _ctx.currentPattern?.name || "Pattern",
                  "onUpdate:modelValue": _ctx.updateRenameValue,
                  onChange: _ctx.submitRename,
                  "hide-details": ""
                }, null, 8, ["model-value", "placeholder", "onUpdate:modelValue", "onChange"]),
                createVNode(_component_v_text_field, {
                  label: "New Pattern Name",
                  dense: "",
                  "model-value": _ctx.newPatternName,
                  "onUpdate:modelValue": _ctx.setNewPatternName,
                  "hide-details": ""
                }, null, 8, ["model-value", "onUpdate:modelValue"]),
                createVNode(_component_v_btn, {
                  class: "mt-1",
                  color: "primary",
                  block: "",
                  onClick: _ctx.addPattern
                }, {
                  default: withCtx(() => [
                    createTextVNode("Add Pattern")
                  ]),
                  _: 1
                }, 8, ["onClick"]),
                createVNode(_component_v_row, {
                  class: "mt-2",
                  dense: ""
                }, {
                  default: withCtx(() => [
                    createVNode(_component_v_col, { cols: "6" }, {
                      default: withCtx(() => [
                        createVNode(_component_v_btn, {
                          color: "secondary",
                          block: "",
                          onClick: _ctx.emitPatternUndo
                        }, {
                          default: withCtx(() => [
                            createTextVNode("Undo")
                          ]),
                          _: 1
                        }, 8, ["onClick"])
                      ]),
                      _: 1
                    }),
                    createVNode(_component_v_col, { cols: "6" }, {
                      default: withCtx(() => [
                        createVNode(_component_v_btn, {
                          color: "secondary",
                          block: "",
                          variant: "outlined",
                          onClick: _ctx.emitPatternRedo
                        }, {
                          default: withCtx(() => [
                            createTextVNode("Redo")
                          ]),
                          _: 1
                        }, 8, ["onClick"])
                      ]),
                      _: 1
                    })
                  ]),
                  _: 1
                })
              ];
            }
          }),
          _: 1
        }, _parent2, _scopeId));
        _push2(ssrRenderComponent(_component_v_col, {
          cols: "12",
          md: "6"
        }, {
          default: withCtx((_2, _push3, _parent3, _scopeId2) => {
            if (_push3) {
              _push3(ssrRenderComponent(_component_v_select, {
                label: "Active Scene",
                dense: "",
                items: _ctx.sceneItems,
                "item-title": "title",
                "item-value": "value",
                "model-value": _ctx.activeSceneId,
                "onUpdate:modelValue": _ctx.selectScene,
                "hide-details": "",
                clearable: ""
              }, null, _parent3, _scopeId2));
              _push3(ssrRenderComponent(_component_v_text_field, {
                label: "Scene Name",
                dense: "",
                "model-value": _ctx.sceneName,
                "onUpdate:modelValue": _ctx.updateSceneName,
                onChange: _ctx.emitSceneUpdate,
                "hide-details": ""
              }, null, _parent3, _scopeId2));
              _push3(ssrRenderComponent(_component_v_combobox, {
                label: "Pattern Chain",
                dense: "",
                clearable: "",
                multiple: "",
                chips: "",
                items: _ctx.patternItems,
                "item-title": "title",
                "item-value": "value",
                "model-value": _ctx.scenePatternIds,
                "onUpdate:modelValue": _ctx.setScenePatternIds,
                "hide-details": ""
              }, null, _parent3, _scopeId2));
              _push3(ssrRenderComponent(_component_v_btn, {
                class: "mt-1",
                color: "secondary",
                block: "",
                onClick: _ctx.addScene
              }, {
                default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                  if (_push4) {
                    _push4(`Add Scene`);
                  } else {
                    return [
                      createTextVNode("Add Scene")
                    ];
                  }
                }),
                _: 1
              }, _parent3, _scopeId2));
            } else {
              return [
                createVNode(_component_v_select, {
                  label: "Active Scene",
                  dense: "",
                  items: _ctx.sceneItems,
                  "item-title": "title",
                  "item-value": "value",
                  "model-value": _ctx.activeSceneId,
                  "onUpdate:modelValue": _ctx.selectScene,
                  "hide-details": "",
                  clearable: ""
                }, null, 8, ["items", "model-value", "onUpdate:modelValue"]),
                createVNode(_component_v_text_field, {
                  label: "Scene Name",
                  dense: "",
                  "model-value": _ctx.sceneName,
                  "onUpdate:modelValue": _ctx.updateSceneName,
                  onChange: _ctx.emitSceneUpdate,
                  "hide-details": ""
                }, null, 8, ["model-value", "onUpdate:modelValue", "onChange"]),
                createVNode(_component_v_combobox, {
                  label: "Pattern Chain",
                  dense: "",
                  clearable: "",
                  multiple: "",
                  chips: "",
                  items: _ctx.patternItems,
                  "item-title": "title",
                  "item-value": "value",
                  "model-value": _ctx.scenePatternIds,
                  "onUpdate:modelValue": _ctx.setScenePatternIds,
                  "hide-details": ""
                }, null, 8, ["items", "model-value", "onUpdate:modelValue"]),
                createVNode(_component_v_btn, {
                  class: "mt-1",
                  color: "secondary",
                  block: "",
                  onClick: _ctx.addScene
                }, {
                  default: withCtx(() => [
                    createTextVNode("Add Scene")
                  ]),
                  _: 1
                }, 8, ["onClick"])
              ];
            }
          }),
          _: 1
        }, _parent2, _scopeId));
      } else {
        return [
          createVNode(_component_v_col, {
            cols: "12",
            md: "6"
          }, {
            default: withCtx(() => [
              createVNode(_component_v_select, {
                label: "Current Pattern",
                dense: "",
                items: _ctx.patternItems,
                "item-title": "title",
                "item-value": "value",
                "model-value": _ctx.selectedPatternId,
                "onUpdate:modelValue": _ctx.handlePatternSelect,
                "hide-details": ""
              }, null, 8, ["items", "model-value", "onUpdate:modelValue"]),
              createVNode(_component_v_text_field, {
                label: "Rename Pattern",
                dense: "",
                "model-value": _ctx.renameValue,
                placeholder: _ctx.currentPattern?.name || "Pattern",
                "onUpdate:modelValue": _ctx.updateRenameValue,
                onChange: _ctx.submitRename,
                "hide-details": ""
              }, null, 8, ["model-value", "placeholder", "onUpdate:modelValue", "onChange"]),
              createVNode(_component_v_text_field, {
                label: "New Pattern Name",
                dense: "",
                "model-value": _ctx.newPatternName,
                "onUpdate:modelValue": _ctx.setNewPatternName,
                "hide-details": ""
              }, null, 8, ["model-value", "onUpdate:modelValue"]),
              createVNode(_component_v_btn, {
                class: "mt-1",
                color: "primary",
                block: "",
                onClick: _ctx.addPattern
              }, {
                default: withCtx(() => [
                  createTextVNode("Add Pattern")
                ]),
                _: 1
              }, 8, ["onClick"]),
              createVNode(_component_v_row, {
                class: "mt-2",
                dense: ""
              }, {
                default: withCtx(() => [
                  createVNode(_component_v_col, { cols: "6" }, {
                    default: withCtx(() => [
                      createVNode(_component_v_btn, {
                        color: "secondary",
                        block: "",
                        onClick: _ctx.emitPatternUndo
                      }, {
                        default: withCtx(() => [
                          createTextVNode("Undo")
                        ]),
                        _: 1
                      }, 8, ["onClick"])
                    ]),
                    _: 1
                  }),
                  createVNode(_component_v_col, { cols: "6" }, {
                    default: withCtx(() => [
                      createVNode(_component_v_btn, {
                        color: "secondary",
                        block: "",
                        variant: "outlined",
                        onClick: _ctx.emitPatternRedo
                      }, {
                        default: withCtx(() => [
                          createTextVNode("Redo")
                        ]),
                        _: 1
                      }, 8, ["onClick"])
                    ]),
                    _: 1
                  })
                ]),
                _: 1
              })
            ]),
            _: 1
          }),
          createVNode(_component_v_col, {
            cols: "12",
            md: "6"
          }, {
            default: withCtx(() => [
              createVNode(_component_v_select, {
                label: "Active Scene",
                dense: "",
                items: _ctx.sceneItems,
                "item-title": "title",
                "item-value": "value",
                "model-value": _ctx.activeSceneId,
                "onUpdate:modelValue": _ctx.selectScene,
                "hide-details": "",
                clearable: ""
              }, null, 8, ["items", "model-value", "onUpdate:modelValue"]),
              createVNode(_component_v_text_field, {
                label: "Scene Name",
                dense: "",
                "model-value": _ctx.sceneName,
                "onUpdate:modelValue": _ctx.updateSceneName,
                onChange: _ctx.emitSceneUpdate,
                "hide-details": ""
              }, null, 8, ["model-value", "onUpdate:modelValue", "onChange"]),
              createVNode(_component_v_combobox, {
                label: "Pattern Chain",
                dense: "",
                clearable: "",
                multiple: "",
                chips: "",
                items: _ctx.patternItems,
                "item-title": "title",
                "item-value": "value",
                "model-value": _ctx.scenePatternIds,
                "onUpdate:modelValue": _ctx.setScenePatternIds,
                "hide-details": ""
              }, null, 8, ["items", "model-value", "onUpdate:modelValue"]),
              createVNode(_component_v_btn, {
                class: "mt-1",
                color: "secondary",
                block: "",
                onClick: _ctx.addScene
              }, {
                default: withCtx(() => [
                  createTextVNode("Add Scene")
                ]),
                _: 1
              }, 8, ["onClick"])
            ]),
            _: 1
          })
        ];
      }
    }),
    _: 1
  }, _parent));
  _push(`</div></div>`);
}
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/panels/PatternsPanel.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const PatternsPanel = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$3, [["ssrRender", ssrRender$3], ["__scopeId", "data-v-8034c803"]]), { __name: "PanelsPatternsPanel" });
const _sfc_main$2 = defineComponent({
  name: "ExportPanel",
  props: {
    isExporting: { type: Boolean, required: true },
    exportError: { type: String, default: null },
    exportMetadata: { type: Object, default: null },
    audioBlob: { type: Object, default: null },
    hasZipArtifacts: { type: Boolean, required: true },
    stemEntries: {
      type: Array,
      default: () => []
    }
  },
  emits: ["export", "download:mixdown", "download:zip", "download:stem", "download:stems"],
  computed: {
    metadata() {
      return this.exportMetadata;
    },
    gridLabel() {
      const spec = this.exportMetadata?.gridSpec;
      if (!spec) return "—";
      return `${spec.bars} bar${spec.bars === 1 ? "" : "s"} • 1/${spec.division}`;
    },
    formattedDuration() {
      const duration = this.exportMetadata?.durationSec;
      if (typeof duration !== "number") return "—";
      return `${duration.toFixed(2)}s`;
    }
  }
});
function ssrRender$2(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  const _component_v_btn = resolveComponent("v-btn");
  const _component_v_alert = resolveComponent("v-alert");
  const _component_v_divider = resolveComponent("v-divider");
  const _component_v_list = resolveComponent("v-list");
  const _component_v_list_item = resolveComponent("v-list-item");
  const _component_v_list_item_title = resolveComponent("v-list-item-title");
  const _component_v_list_item_subtitle = resolveComponent("v-list-item-subtitle");
  _push(`<div${ssrRenderAttrs(mergeProps({ class: "panel-shell" }, _attrs))} data-v-5c4f0f73><div class="panel-header" data-v-5c4f0f73>Export</div><div class="panel-body" data-v-5c4f0f73>`);
  _push(ssrRenderComponent(_component_v_btn, {
    color: "primary",
    block: "",
    loading: _ctx.isExporting,
    disabled: _ctx.isExporting,
    onClick: ($event) => _ctx.$emit("export")
  }, {
    default: withCtx((_, _push2, _parent2, _scopeId) => {
      if (_push2) {
        _push2(`Export mixdown`);
      } else {
        return [
          createTextVNode("Export mixdown")
        ];
      }
    }),
    _: 1
  }, _parent));
  if (_ctx.exportError) {
    _push(ssrRenderComponent(_component_v_alert, {
      class: "mt-2",
      type: "error",
      dense: ""
    }, {
      default: withCtx((_, _push2, _parent2, _scopeId) => {
        if (_push2) {
          _push2(`${ssrInterpolate(_ctx.exportError)}`);
        } else {
          return [
            createTextVNode(toDisplayString(_ctx.exportError), 1)
          ];
        }
      }),
      _: 1
    }, _parent));
  } else {
    _push(`<!---->`);
  }
  _push(`<div class="metadata-grid" data-v-5c4f0f73><div class="metadata-row" data-v-5c4f0f73><span class="label" data-v-5c4f0f73>Seed</span><span class="value" data-v-5c4f0f73>${ssrInterpolate(_ctx.metadata?.seed ?? "—")}</span></div><div class="metadata-row" data-v-5c4f0f73><span class="label" data-v-5c4f0f73>BPM</span><span class="value" data-v-5c4f0f73>${ssrInterpolate(_ctx.metadata?.bpm ?? "—")}</span></div><div class="metadata-row" data-v-5c4f0f73><span class="label" data-v-5c4f0f73>Duration</span><span class="value" data-v-5c4f0f73>${ssrInterpolate(_ctx.formattedDuration)}</span></div><div class="metadata-row" data-v-5c4f0f73><span class="label" data-v-5c4f0f73>Grid</span><span class="value" data-v-5c4f0f73>${ssrInterpolate(_ctx.gridLabel)}</span></div></div>`);
  _push(ssrRenderComponent(_component_v_btn, {
    class: "mt-2",
    color: "secondary",
    block: "",
    disabled: !_ctx.audioBlob || _ctx.isExporting,
    onClick: ($event) => _ctx.$emit("download:mixdown")
  }, {
    default: withCtx((_, _push2, _parent2, _scopeId) => {
      if (_push2) {
        _push2(`Download WAV`);
      } else {
        return [
          createTextVNode("Download WAV")
        ];
      }
    }),
    _: 1
  }, _parent));
  _push(ssrRenderComponent(_component_v_btn, {
    class: "mt-2",
    color: "secondary",
    block: "",
    disabled: !_ctx.hasZipArtifacts || _ctx.isExporting,
    variant: "outlined",
    onClick: ($event) => _ctx.$emit("download:zip")
  }, {
    default: withCtx((_, _push2, _parent2, _scopeId) => {
      if (_push2) {
        _push2(`Download ZIP bundle`);
      } else {
        return [
          createTextVNode("Download ZIP bundle")
        ];
      }
    }),
    _: 1
  }, _parent));
  _push(ssrRenderComponent(_component_v_divider, { class: "my-3" }, null, _parent));
  if (_ctx.stemEntries.length > 0) {
    _push(`<div class="stem-header" data-v-5c4f0f73><span data-v-5c4f0f73>Stem exports</span>`);
    _push(ssrRenderComponent(_component_v_btn, {
      class: "ml-auto",
      text: "",
      small: "",
      disabled: _ctx.isExporting,
      onClick: ($event) => _ctx.$emit("download:stems")
    }, {
      default: withCtx((_, _push2, _parent2, _scopeId) => {
        if (_push2) {
          _push2(`Download all`);
        } else {
          return [
            createTextVNode("Download all")
          ];
        }
      }),
      _: 1
    }, _parent));
    _push(`</div>`);
  } else {
    _push(`<!---->`);
  }
  if (_ctx.stemEntries.length > 0) {
    _push(ssrRenderComponent(_component_v_list, { density: "compact" }, {
      default: withCtx((_, _push2, _parent2, _scopeId) => {
        if (_push2) {
          _push2(`<!--[-->`);
          ssrRenderList(_ctx.stemEntries, (stem) => {
            _push2(ssrRenderComponent(_component_v_list_item, {
              key: stem.padId
            }, {
              append: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(ssrRenderComponent(_component_v_btn, {
                    text: "",
                    small: "",
                    disabled: _ctx.isExporting,
                    onClick: ($event) => _ctx.$emit("download:stem", stem.padId)
                  }, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(`Download`);
                      } else {
                        return [
                          createTextVNode("Download")
                        ];
                      }
                    }),
                    _: 2
                  }, _parent3, _scopeId2));
                } else {
                  return [
                    createVNode(_component_v_btn, {
                      text: "",
                      small: "",
                      disabled: _ctx.isExporting,
                      onClick: ($event) => _ctx.$emit("download:stem", stem.padId)
                    }, {
                      default: withCtx(() => [
                        createTextVNode("Download")
                      ]),
                      _: 1
                    }, 8, ["disabled", "onClick"])
                  ];
                }
              }),
              default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                if (_push3) {
                  _push3(ssrRenderComponent(_component_v_list_item_title, null, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(`${ssrInterpolate(stem.label)}`);
                      } else {
                        return [
                          createTextVNode(toDisplayString(stem.label), 1)
                        ];
                      }
                    }),
                    _: 2
                  }, _parent3, _scopeId2));
                  _push3(ssrRenderComponent(_component_v_list_item_subtitle, null, {
                    default: withCtx((_3, _push4, _parent4, _scopeId3) => {
                      if (_push4) {
                        _push4(`${ssrInterpolate(stem.fileName)}`);
                      } else {
                        return [
                          createTextVNode(toDisplayString(stem.fileName), 1)
                        ];
                      }
                    }),
                    _: 2
                  }, _parent3, _scopeId2));
                } else {
                  return [
                    createVNode(_component_v_list_item_title, null, {
                      default: withCtx(() => [
                        createTextVNode(toDisplayString(stem.label), 1)
                      ]),
                      _: 2
                    }, 1024),
                    createVNode(_component_v_list_item_subtitle, null, {
                      default: withCtx(() => [
                        createTextVNode(toDisplayString(stem.fileName), 1)
                      ]),
                      _: 2
                    }, 1024)
                  ];
                }
              }),
              _: 2
            }, _parent2, _scopeId));
          });
          _push2(`<!--]-->`);
        } else {
          return [
            (openBlock(true), createBlock(Fragment, null, renderList(_ctx.stemEntries, (stem) => {
              return openBlock(), createBlock(_component_v_list_item, {
                key: stem.padId
              }, {
                append: withCtx(() => [
                  createVNode(_component_v_btn, {
                    text: "",
                    small: "",
                    disabled: _ctx.isExporting,
                    onClick: ($event) => _ctx.$emit("download:stem", stem.padId)
                  }, {
                    default: withCtx(() => [
                      createTextVNode("Download")
                    ]),
                    _: 1
                  }, 8, ["disabled", "onClick"])
                ]),
                default: withCtx(() => [
                  createVNode(_component_v_list_item_title, null, {
                    default: withCtx(() => [
                      createTextVNode(toDisplayString(stem.label), 1)
                    ]),
                    _: 2
                  }, 1024),
                  createVNode(_component_v_list_item_subtitle, null, {
                    default: withCtx(() => [
                      createTextVNode(toDisplayString(stem.fileName), 1)
                    ]),
                    _: 2
                  }, 1024)
                ]),
                _: 2
              }, 1024);
            }), 128))
          ];
        }
      }),
      _: 1
    }, _parent));
  } else {
    _push(`<!---->`);
  }
  _push(`</div></div>`);
}
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/panels/ExportPanel.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const ExportPanel = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$2, [["ssrRender", ssrRender$2], ["__scopeId", "data-v-5c4f0f73"]]), { __name: "PanelsExportPanel" });
const textEncoder = new TextEncoder();
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let crc = i;
    for (let j = 0; j < 8; j += 1) {
      crc = crc & 1 ? 3988292384 ^ crc >>> 1 : crc >>> 1;
    }
    table[i] = crc >>> 0;
  }
  return table;
})();
const crc32 = (data) => {
  let crc = 4294967295;
  for (let i = 0; i < data.length; i += 1) {
    const byte = data[i] ?? 0;
    const tableValue = CRC_TABLE[(crc ^ byte) & 255] ?? 0;
    crc = tableValue ^ crc >>> 8;
  }
  return (crc ^ 4294967295) >>> 0;
};
const createZip = (entries) => {
  const localChunks = [];
  const centralChunks = [];
  let offset = 0;
  let centralSize = 0;
  for (const entry of entries) {
    const { name, data } = entry;
    const crc = crc32(data);
    const nameBytes = textEncoder.encode(name);
    const localHeaderBuffer = new ArrayBuffer(30 + nameBytes.length);
    const localView = new DataView(localHeaderBuffer);
    localView.setUint32(0, 67324752, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0, true);
    localView.setUint16(8, 0, true);
    localView.setUint16(10, 0, true);
    localView.setUint16(12, 0, true);
    localView.setUint32(14, crc, true);
    localView.setUint32(18, data.length, true);
    localView.setUint32(22, data.length, true);
    localView.setUint16(26, nameBytes.length, true);
    localView.setUint16(28, 0, true);
    const localHeaderBytes = new Uint8Array(localHeaderBuffer);
    localHeaderBytes.set(nameBytes, 30);
    localChunks.push(localHeaderBuffer);
    let ab;
    if (data.buffer instanceof ArrayBuffer && !(data.buffer instanceof SharedArrayBuffer)) {
      ab = data.buffer.slice(0, data.byteLength);
    } else {
      ab = new Uint8Array(data).buffer.slice(0);
    }
    localChunks.push(ab);
    const centralHeaderBuffer = new ArrayBuffer(46 + nameBytes.length);
    const centralView = new DataView(centralHeaderBuffer);
    centralView.setUint32(0, 33639248, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, 0, true);
    centralView.setUint16(14, 0, true);
    centralView.setUint32(16, crc, true);
    centralView.setUint32(20, data.length, true);
    centralView.setUint32(24, data.length, true);
    centralView.setUint16(28, nameBytes.length, true);
    centralView.setUint16(30, 0, true);
    centralView.setUint16(32, 0, true);
    centralView.setUint16(34, 0, true);
    centralView.setUint16(36, 0, true);
    centralView.setUint32(38, 0, true);
    centralView.setUint32(42, offset, true);
    const centralHeaderBytes = new Uint8Array(centralHeaderBuffer);
    centralHeaderBytes.set(nameBytes, 46);
    centralChunks.push(centralHeaderBuffer);
    offset += localHeaderBytes.length + data.length;
    centralSize += centralHeaderBytes.length;
  }
  const endBuffer = new ArrayBuffer(22);
  const endView = new DataView(endBuffer);
  endView.setUint32(0, 101010256, true);
  endView.setUint16(4, 0, true);
  endView.setUint16(6, 0, true);
  endView.setUint16(8, entries.length, true);
  endView.setUint16(10, entries.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);
  endView.setUint16(20, 0, true);
  const parts = [
    ...localChunks,
    ...centralChunks,
    endBuffer
  ];
  return new Blob(parts, { type: "application/zip" });
};
const slugify = (value) => {
  const cleaned = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  return cleaned || "drum-session";
};
const VISIBLE_DIVISIONS = GRID_DIVISIONS.filter((value) => value <= 16);
const _sfc_main$1 = defineComponent({
  name: "DrumMachine",
  components: {
    TransportBar: __nuxt_component_0$3,
    PadGrid: __nuxt_component_1$1,
    StepGrid: __nuxt_component_2,
    TabPanel,
    SoundPanel,
    FxPanel,
    PatternsPanel,
    ExportPanel
  },
  data() {
    const transport = useTransportStore();
    const patterns = usePatternsStore();
    const soundbanks = useSoundbanksStore();
    const session = useSessionStore();
    const capabilitiesProbe = useCapabilities();
    session.setCapabilities(capabilitiesProbe.capabilities.value);
    const importExport = useImportExport();
    const sequencer = useSequencer({
      getPattern: () => patterns.currentPattern,
      onPatternBoundary: () => patterns.advanceScenePlayback()
    });
    const midi = useMidi();
    const handleExternalStart = () => {
      if (!transport.isPlaying) {
        patterns.prepareScenePlayback();
        void sequencer.start().catch((error) => {
          console.error("Failed to start sequencer from external sync", error);
        });
      }
    };
    const handleExternalStop = () => {
      if (transport.isPlaying) {
        sequencer.stop();
      }
    };
    const sync = useSync("internal", {
      midi,
      getAudioTime: () => sequencer.getAudioTime(),
      onExternalStart: handleExternalStart,
      onExternalStop: handleExternalStop
    });
    const patternStorage = usePatternStorage();
    const soundbankStorage = useSoundbankStorage();
    const pads = [
      "pad1",
      "pad2",
      "pad3",
      "pad4",
      "pad5",
      "pad6",
      "pad7",
      "pad8",
      "pad9",
      "pad10",
      "pad11",
      "pad12",
      "pad13",
      "pad14",
      "pad15",
      "pad16"
    ];
    const divisions = [...VISIBLE_DIVISIONS];
    const defaultBank = {
      id: "default-kit",
      name: "Default Kit",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      pads: {
        pad1: { id: "kick", name: "Kick", url: "/samples/kick.wav", format: "wav" },
        pad5: { id: "kick-2", name: "Kick 2", url: "/samples/kick.wav", format: "wav" },
        pad9: { id: "kick-3", name: "Kick 3", url: "/samples/kick.wav", format: "wav" },
        pad13: { id: "kick-4", name: "Kick 4", url: "/samples/kick.wav", format: "wav" },
        pad2: { id: "snare", name: "Snare", url: "/samples/snare.wav", format: "wav" },
        pad6: { id: "snare-2", name: "Snare 2", url: "/samples/snare.wav", format: "wav" },
        pad10: { id: "snare-3", name: "Snare 3", url: "/samples/snare.wav", format: "wav" },
        pad14: { id: "snare-4", name: "Snare 4", url: "/samples/snare.wav", format: "wav" },
        pad3: { id: "hihat", name: "Hi-Hat", url: "/samples/hihat.wav", format: "wav" },
        pad7: { id: "hihat-2", name: "Hi-Hat 2", url: "/samples/hihat.wav", format: "wav" },
        pad11: { id: "hihat-3", name: "Hi-Hat 3", url: "/samples/hihat.wav", format: "wav" },
        pad15: { id: "hihat-4", name: "Hi-Hat 4", url: "/samples/hihat.wav", format: "wav" },
        pad4: { id: "clap", name: "Clap", url: "/samples/clap.wav", format: "wav" },
        pad8: { id: "clap-2", name: "Clap 2", url: "/samples/clap.wav", format: "wav" },
        pad12: { id: "clap-3", name: "Clap 3", url: "/samples/clap.wav", format: "wav" },
        pad16: { id: "clap-4", name: "Clap 4", url: "/samples/clap.wav", format: "wav" }
      }
    };
    if (soundbanks.banks.length === 0) {
      soundbanks.setBanks([defaultBank]);
    }
    return {
      transport,
      patterns,
      soundbanks,
      session,
      sequencer,
      sync,
      midi,
      patternStorage,
      soundbankStorage,
      pads,
      divisions,
      defaultBank,
      unwatchers: [],
      exportMetadata: null,
      exportAudioBlob: null,
      exportTimeline: void 0,
      exportStems: null,
      isExporting: false,
      exportError: null,
      exportAudioFn: importExport.exportAudio,
      selectedPadId: "pad1",
      drawerTab: "sound"
    };
  },
  computed: {
    gridSpec() {
      return this.patterns.currentPattern?.gridSpec ?? { ...DEFAULT_GRID_SPEC };
    },
    pattern() {
      return this.patterns.currentPattern ?? { id: "pattern-1", name: "Pattern 1", gridSpec: { ...DEFAULT_GRID_SPEC }, steps: {} };
    },
    currentStep() {
      return this.transport.currentStep;
    },
    bpm() {
      return this.transport.bpm;
    },
    isPlaying() {
      return this.transport.isPlaying;
    },
    midiInputs() {
      return this.midi.inputs;
    },
    midiOutputs() {
      return this.midi.outputs;
    },
    banks() {
      return this.soundbanks.banks;
    },
    syncState() {
      return this.sync.state;
    },
    capabilities() {
      return this.session.capabilities;
    },
    padStates() {
      const bankPads = this.soundbanks.currentBank?.pads ?? {};
      const result = {};
      const stepsPerPattern = Math.max(1, this.gridSpec.bars * this.gridSpec.division);
      const normalizedStep = (this.currentStep % stepsPerPattern + stepsPerPattern) % stepsPerPattern;
      const barIndex = Math.floor(normalizedStep / this.gridSpec.division);
      const stepIndex = normalizedStep % this.gridSpec.division;
      const currentRow = this.pattern.steps[barIndex]?.[stepIndex] ?? {};
      const triggered = new Set(Object.keys(currentRow));
      const playingPads = /* @__PURE__ */ new Set();
      Object.values(this.pattern.steps).forEach((bar) => {
        Object.values(bar).forEach((step) => {
          Object.keys(step).forEach((padId) => playingPads.add(padId));
        });
      });
      this.pads.forEach((pad) => {
        result[pad] = {
          label: bankPads[pad]?.name ?? pad.toUpperCase(),
          isTriggered: triggered.has(pad),
          isPlaying: this.isPlaying && playingPads.has(pad)
        };
      });
      return result;
    },
    hasZipArtifacts() {
      return Boolean(this.exportMetadata && this.exportAudioBlob);
    },
    stemEntries() {
      if (!this.exportStems) {
        return [];
      }
      const bankPads = this.soundbanks.currentBank?.pads ?? {};
      return Object.entries(this.exportStems).map(([padId, entry]) => ({
        padId,
        label: bankPads[padId]?.name ?? padId,
        fileName: entry.fileName
      }));
    }
  },
  mounted() {
    const storedPatterns = this.patternStorage.load();
    if (storedPatterns.patterns.length > 0) {
      this.patterns.setPatterns(storedPatterns.patterns);
    }
    if (storedPatterns.scenes.length > 0) {
      this.patterns.setScenes(storedPatterns.scenes);
    }
    if (storedPatterns.selectedPatternId && this.patterns.patterns.find((pattern) => pattern.id === storedPatterns.selectedPatternId)) {
      this.patterns.selectPattern(storedPatterns.selectedPatternId);
    }
    this.patterns.selectScene(storedPatterns.activeSceneId ?? null);
    void this.initializeSoundbank();
    const persistPatterns = () => this.patternStorage.save({
      patterns: this.patterns.patterns,
      scenes: this.patterns.scenes,
      selectedPatternId: this.patterns.selectedPatternId,
      activeSceneId: this.patterns.activeSceneId
    });
    const stopWatch = this.$watch(
      () => [this.patterns.patterns, this.patterns.scenes, this.patterns.selectedPatternId, this.patterns.activeSceneId],
      persistPatterns,
      { deep: true }
    );
    const stopBankPatternWatch = this.$watch(
      () => this.patterns.patterns,
      (value) => {
        const bankId = this.soundbanks.selectedBankId;
        if (bankId) {
          void this.soundbankStorage.savePatterns(bankId, value);
        }
      },
      { deep: true }
    );
    const stopMidiListener = this.midi.listen((message) => {
      if (message.type === "noteon" && typeof message.note === "number") {
        const pad = this.midi.mapNoteToPad(message.note);
        if (pad) {
          this.handlePad(pad, message.velocity ?? 1);
        }
      }
    });
    this.unwatchers.push(stopWatch);
    this.unwatchers.push(stopBankPatternWatch);
    this.unwatchers.push(() => stopMidiListener?.());
  },
  beforeUnmount() {
    this.unwatchers.forEach((stop) => stop());
  },
  methods: {
    addPattern(payload) {
      this.patterns.addPattern(payload?.name);
    },
    selectPattern(id) {
      this.patterns.selectPattern(id);
    },
    renamePattern(payload) {
      this.patterns.renamePattern(payload.id, payload.name);
    },
    undoPattern() {
      this.patterns.undo();
    },
    redoPattern() {
      this.patterns.redo();
    },
    addScene(payload) {
      this.patterns.addScene(payload?.name ?? "Scene", payload?.patternIds ?? []);
    },
    updateScene(payload) {
      const updates = {};
      if (typeof payload.name === "string") {
        updates.name = payload.name;
      }
      if (Array.isArray(payload.patternIds)) {
        updates.patternIds = payload.patternIds;
      }
      if (Object.keys(updates).length > 0) {
        this.patterns.updateScene(payload.id, updates);
      }
    },
    selectScene(id) {
      this.patterns.selectScene(id);
    },
    updateFx(settings) {
      this.sequencer.setFx(settings);
    },
    updateBpm(bpm) {
      this.transport.setBpm(bpm);
      this.sync.setBpm(bpm);
    },
    async start() {
      if (this.transport.isPlaying) return;
      this.patterns.prepareScenePlayback();
      await this.sequencer.start();
      this.sync.startTransport(this.transport.bpm);
    },
    stop() {
      this.sequencer.stop();
      this.sync.stopTransport();
    },
    async handlePad(pad, velocity = 1) {
      try {
        await this.sequencer.recordHit(pad, velocity, true);
      } catch (error) {
        console.error("Failed to trigger pad", error);
      }
      this.selectPad(pad);
    },
    selectPad(pad) {
      this.selectedPadId = pad;
    },
    toggleStep(payload) {
      this.patterns.toggleStep(payload.barIndex, payload.stepInBar, payload.padId);
    },
    async requestMidi() {
      await this.midi.requestAccess();
      this.session.setCapabilities({
        supportsAudioInput: this.session.capabilities.supportsAudioInput,
        supportsWebMIDI: this.midi.supportsMidi()
      });
      if (this.midi.inputs.length > 0 && !this.midi.selectedInputId) {
        this.midi.setSelectedInput(this.midi.inputs[0]?.id ?? null);
      }
      if (this.midi.outputs.length > 0 && !this.midi.selectedOutputId) {
        this.midi.setSelectedOutput(this.midi.outputs[0]?.id ?? null);
      }
    },
    selectMidiInput(id) {
      this.midi.setSelectedInput(id);
    },
    selectMidiOutput(id) {
      this.midi.setSelectedOutput(id);
    },
    mapPadToNote(payload) {
      if (payload.note >= 0 && payload.note <= 127) {
        this.midi.setPadForNote(payload.note, payload.padId);
      }
    },
    setSyncMode(mode) {
      if (mode === "internal" || mode === "midiClock" || mode === "abletonLink") {
        this.sync.setMode(mode);
      }
    },
    setSyncRole(role) {
      if (role === "master" || role === "slave") {
        this.sync.setRole(role);
      }
    },
    setLoop(loop) {
      this.transport.setLoop(loop);
    },
    setDivision(division) {
      const gridSpec = normalizeGridSpec({ ...this.gridSpec, division });
      this.transport.setGridSpec(gridSpec);
      this.patterns.updateGridSpec(gridSpec);
    },
    selectBank(id) {
      this.soundbanks.selectBank(id);
      void this.initializeSoundbank();
    },
    inferFormatFromName(name) {
      const lower = name.toLowerCase();
      if (lower.endsWith(".wav")) return "wav";
      if (lower.endsWith(".mp3")) return "mp3";
      if (lower.endsWith(".ogg")) return "ogg";
      if (lower.endsWith(".aac")) return "aac";
      if (lower.endsWith(".flac")) return "flac";
      return void 0;
    },
    async replacePadSample(payload) {
      const bank = this.soundbanks.currentBank ?? this.defaultBank;
      const existing = bank.pads[payload.padId];
      if (existing?.url && existing.url.startsWith("blob:")) {
        URL.revokeObjectURL(existing.url);
      }
      const sampleId = `${payload.padId}-${Date.now()}`;
      const format = this.inferFormatFromName(payload.file.name) ?? "wav";
      const sample = {
        id: sampleId,
        name: payload.file.name,
        format,
        blob: payload.file,
        url: URL.createObjectURL(payload.file)
      };
      const updatedBank = {
        ...bank,
        pads: { ...bank.pads, [payload.padId]: sample },
        updatedAt: Date.now()
      };
      this.soundbanks.upsertBank(updatedBank);
      await this.soundbankStorage.saveBank(updatedBank);
      await this.soundbankStorage.saveSample(sample);
      await this.sequencer.setSampleForPad(payload.padId, sample);
      await this.sequencer.applySoundbank(updatedBank);
    },
    async hydrateSamplesForBank(bank) {
      const hydratedPads = {};
      const entries = Object.entries(bank.pads);
      for (const [padId, sample] of entries) {
        if (!sample) continue;
        let hydrated = sample;
        if (!sample.blob) {
          const stored = await this.soundbankStorage.loadSample(sample.id);
          if (stored?.blob) {
            hydrated = { ...sample, blob: stored.blob };
          }
        }
        hydratedPads[padId] = hydrated;
      }
      return { ...bank, pads: hydratedPads };
    },
    async initializeSoundbank() {
      const storedBanks = await this.soundbankStorage.loadBanks();
      if (storedBanks.length > 0) {
        this.soundbanks.setBanks(storedBanks);
      } else if (this.soundbanks.banks.length === 0) {
        this.soundbanks.setBanks([this.defaultBank]);
        await this.soundbankStorage.saveBank(this.defaultBank);
      }
      const bank = this.soundbanks.currentBank ?? this.soundbanks.banks[0] ?? this.defaultBank;
      const hydratedBank = await this.hydrateSamplesForBank(bank);
      this.soundbanks.upsertBank(hydratedBank);
      const bankPatterns = await this.soundbankStorage.loadPatterns(hydratedBank.id);
      if (bankPatterns.length > 0) {
        this.patterns.setPatterns(bankPatterns);
      }
      await this.sequencer.applySoundbank(hydratedBank);
    },
    getScenePatternChain() {
      const chain = this.patterns.currentScene?.patternIds ?? [];
      const filtered = chain.filter((patternId) => this.patterns.patterns.some((pattern) => pattern.id === patternId));
      if (filtered.length > 0) {
        return filtered;
      }
      const fallback = this.patterns.selectedPatternId ?? this.patterns.patterns[0]?.id;
      return fallback ? [fallback] : [];
    },
    computeExportDuration() {
      const bpm = Math.max(1, this.transport.bpm);
      const chain = this.getScenePatternChain();
      const totalBars = chain.reduce((sum, patternId) => {
        const pattern = this.patterns.patterns.find((entry) => entry.id === patternId);
        return sum + (pattern?.gridSpec?.bars ?? DEFAULT_GRID_SPEC.bars);
      }, 0);
      const bars = totalBars || DEFAULT_GRID_SPEC.bars;
      return bars * 4 * 60 / bpm;
    },
    async exportBounce() {
      if (this.isExporting) return;
      this.isExporting = true;
      this.exportError = null;
      this.exportStems = null;
      try {
        const result = await this.exportAudioFn(this.computeExportDuration());
        this.exportMetadata = result.metadata;
        this.exportAudioBlob = result.audioBlob;
        this.exportTimeline = result.debugTimeline;
        this.exportStems = result.stems ?? null;
      } catch (error) {
        console.error("Failed to export audio", error);
        this.exportError = "Failed to export audio";
        this.exportStems = null;
      } finally {
        this.isExporting = false;
      }
    },
    downloadStem(pad) {
      if (this.isExporting) return;
      const entry = this.exportStems?.[pad];
      if (!entry) return;
      saveAs(entry.blob, entry.fileName);
    },
    downloadMixdown() {
      if (this.isExporting) return;
      if (!this.exportAudioBlob) return;
      saveAs(this.exportAudioBlob, "mixdown.wav");
    },
    downloadAllStems() {
      if (this.isExporting || !this.exportStems) return;
      Object.values(this.exportStems).forEach((entry) => {
        saveAs(entry.blob, entry.fileName);
      });
    },
    async downloadZip() {
      if (this.isExporting || !this.hasZipArtifacts) return;
      try {
        const metadata = this.exportMetadata;
        const mixdown = this.exportAudioBlob;
        if (!metadata || !mixdown) return;
        const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], { type: "application/json" });
        const files = [
          { name: "mixdown.wav", blob: mixdown },
          { name: "render-meta.json", blob: metadataBlob }
        ];
        if (this.exportStems) {
          Object.entries(this.exportStems).forEach(([padId, entry]) => {
            files.push({ name: `stems/${padId}.wav`, blob: entry.blob });
          });
        }
        const entries = await Promise.all(
          files.map(async (file) => ({
            name: file.name,
            data: new Uint8Array(await file.blob.arrayBuffer())
          }))
        );
        const zipped = createZip(entries);
        const songName = slugify(this.soundbanks.currentBank?.name ?? this.patterns.currentScene?.name ?? this.pattern?.name ?? "drum-session");
        const seedSuffix = metadata.seed ?? Date.now().toString();
        saveAs(zipped, `${songName}_${seedSuffix}.zip`);
      } catch (error) {
        console.error("Failed to create ZIP archive", error);
      }
    }
  }
});
function ssrRender$1(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  const _component_TransportBar = __nuxt_component_0$3;
  const _component_PadGrid = __nuxt_component_1$1;
  const _component_StepGrid = __nuxt_component_2;
  const _component_client_only = __nuxt_component_3;
  _push(`<div${ssrRenderAttrs(mergeProps({ class: "drumshell" }, _attrs))} data-v-58e91f09><div class="hardware-top" data-v-58e91f09>`);
  _push(ssrRenderComponent(_component_TransportBar, {
    bpm: _ctx.bpm,
    isPlaying: _ctx.isPlaying,
    loop: _ctx.transport.loop,
    division: _ctx.gridSpec.division,
    divisions: _ctx.divisions,
    onPlay: _ctx.start,
    onStop: _ctx.stop,
    "onBpm:update": _ctx.updateBpm,
    "onLoop:update": _ctx.setLoop,
    "onDivision:update": _ctx.setDivision
  }, null, _parent));
  _push(`</div><div class="main-shell" data-v-58e91f09><div class="pads-panel" data-v-58e91f09>`);
  _push(ssrRenderComponent(_component_PadGrid, {
    pads: _ctx.pads,
    "selected-pad": _ctx.selectedPadId,
    "pad-states": _ctx.padStates,
    "onPad:down": _ctx.handlePad,
    "onPad:select": _ctx.selectPad
  }, null, _parent));
  _push(`</div><div class="sequencer-panel" data-v-58e91f09>`);
  _push(ssrRenderComponent(_component_StepGrid, {
    "grid-spec": _ctx.gridSpec,
    steps: _ctx.pattern.steps,
    "selected-pad": _ctx.selectedPadId,
    "current-step": _ctx.currentStep,
    "is-playing": _ctx.isPlaying,
    "onStep:toggle": _ctx.toggleStep
  }, null, _parent));
  _push(`</div></div><div class="drawer-wrapper" data-v-58e91f09>`);
  _push(ssrRenderComponent(_component_client_only, { tag: "div" }, {}, _parent));
  _push(`</div></div>`);
}
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/DrumMachine.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const __nuxt_component_0 = /* @__PURE__ */ Object.assign(_export_sfc(_sfc_main$1, [["ssrRender", ssrRender$1], ["__scopeId", "data-v-58e91f09"]]), { __name: "DrumMachine" });
const _sfc_main = defineComponent({
  name: "IndexPage",
  components: { DrumMachine: __nuxt_component_0 }
});
function ssrRender(_ctx, _push, _parent, _attrs, $props, $setup, $data, $options) {
  const _component_DrumMachine = __nuxt_component_0;
  _push(ssrRenderComponent(_component_DrumMachine, _attrs, null, _parent));
}
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["ssrRender", ssrRender]]);

export { index as default };
//# sourceMappingURL=index-ntocajd8.mjs.map
