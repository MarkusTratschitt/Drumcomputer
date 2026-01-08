import { defineStore } from 'pinia';
import { DEFAULT_GRID_SPEC, normalizeGridSpec } from '@/domain/timing';
import { clampVelocity, cycleVelocity, DEFAULT_STEP_VELOCITY } from '@/domain/velocity';
// Manages patterns and scenes with undo/redo history, grid spec updates, and step velocity editing.
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
export const usePatternsStore = defineStore('patterns', {
    state: () => ({
        patterns: [createEmptyPattern('pattern-1', 'Pattern 1')],
        scenes: [],
        selectedPatternId: 'pattern-1',
        activeSceneId: null,
        scenePosition: 0,
        history: [],
        historyIndex: -1,
        isRestoring: false
    }),
    getters: {
        currentPattern(state) {
            return state.patterns.find((p) => p.id === state.selectedPatternId) ?? createEmptyPattern('pattern-1', 'Pattern 1');
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
            if (this.isRestoring)
                return;
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
                this.selectedPatternId = this.patterns[0]?.id ?? 'pattern-1';
            }
            this.activeSceneId = snapshot.activeSceneId;
            this.scenePosition = 0;
            this.isRestoring = false;
        },
        undo() {
            if (this.historyIndex <= 0)
                return;
            this.historyIndex -= 1;
            const snapshot = this.history[this.historyIndex];
            if (snapshot) {
                this.restoreSnapshot(snapshot);
            }
        },
        redo() {
            if (this.historyIndex >= this.history.length - 1)
                return;
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
            this.patterns = patterns.length ? patterns : [createEmptyPattern('pattern-1', 'Pattern 1')];
            if (!this.patterns.find((pattern) => pattern.id === this.selectedPatternId)) {
                this.selectedPatternId = this.patterns[0]?.id ?? 'pattern-1';
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
            }
            else {
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
        eraseStepForPad(barIndex, stepInBar, padId) {
            this.recordHistory();
            const pattern = this.currentPattern;
            const grid = pattern.steps;
            const bar = grid[barIndex] ?? {};
            const stepRow = bar[stepInBar] ?? {};
            if (stepRow && stepRow[padId]) {
                const updated = { ...stepRow };
                delete updated[padId];
                grid[barIndex] = { ...bar, [stepInBar]: updated };
            }
        },
        erasePadEvents(padId) {
            this.recordHistory();
            const pattern = this.currentPattern;
            const grid = pattern.steps;
            Object.entries(grid).forEach(([barIndex, bar]) => {
                const barIdx = Number(barIndex);
                Object.entries(bar ?? {}).forEach(([stepIndex, row]) => {
                    if (row && row[padId]) {
                        const updated = { ...row };
                        delete updated[padId];
                        grid[barIdx] = { ...(grid[barIdx] ?? {}), [Number(stepIndex)]: updated };
                    }
                });
            });
        },
        eraseAutomationForPad(padId) {
            // Placeholder: no automation envelope stored yet; reuse pad erase.
            this.erasePadEvents(padId);
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
            if (!scene)
                return;
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
//# sourceMappingURL=patterns.js.map