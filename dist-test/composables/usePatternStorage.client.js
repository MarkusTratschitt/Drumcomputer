import { ref } from 'vue';
import { DEFAULT_GRID_SPEC, normalizeGridSpec } from '@/domain/timing';
const STORAGE_KEY = 'drum-machine/patterns';
const STORAGE_VERSION = 'v2';
const ensurePatternShape = (pattern, index) => {
    return {
        id: pattern?.id ?? `pattern-${index + 1}`,
        name: pattern?.name ?? `Pattern ${index + 1}`,
        gridSpec: normalizeGridSpec(pattern?.gridSpec ?? DEFAULT_GRID_SPEC),
        steps: pattern?.steps ?? {}
    };
};
export function usePatternStorage() {
    const lastSavedAt = ref(null);
    const save = (payload) => {
        if (typeof window === 'undefined')
            return;
        const normalizedPatterns = payload.patterns.map((pattern, index) => ensurePatternShape(pattern, index));
        const stored = {
            version: STORAGE_VERSION,
            savedAt: Date.now(),
            patterns: normalizedPatterns,
            scenes: payload.scenes ?? [],
            selectedPatternId: payload.selectedPatternId,
            activeSceneId: payload.activeSceneId ?? null
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
        lastSavedAt.value = stored.savedAt;
    };
    const load = () => {
        if (typeof window === 'undefined') {
            return { patterns: [], scenes: [], selectedPatternId: 'pattern-1', activeSceneId: null };
        }
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            return { patterns: [], scenes: [], selectedPatternId: 'pattern-1', activeSceneId: null };
        }
        try {
            const parsed = JSON.parse(raw);
            const version = parsed.version;
            const basePatterns = Array.isArray(parsed.patterns)
                ? parsed.patterns.map((pattern, index) => ensurePatternShape(pattern, index))
                : [];
            const baseState = {
                patterns: basePatterns,
                scenes: [],
                selectedPatternId: basePatterns[0]?.id ?? 'pattern-1',
                activeSceneId: null
            };
            if (version === 'v2') {
                const parsedV2 = parsed;
                if (typeof parsedV2.savedAt === 'number') {
                    lastSavedAt.value = parsedV2.savedAt;
                }
                return {
                    patterns: basePatterns,
                    scenes: Array.isArray(parsedV2.scenes) ? parsedV2.scenes : [],
                    selectedPatternId: parsedV2.selectedPatternId ?? baseState.selectedPatternId,
                    activeSceneId: parsedV2.activeSceneId ?? null
                };
            }
            if (typeof parsed.savedAt === 'number') {
                lastSavedAt.value = parsed.savedAt ?? null;
            }
            return baseState;
        }
        catch (error) {
            console.error('Failed to parse patterns from LocalStorage', error);
            return { patterns: [], scenes: [], selectedPatternId: 'pattern-1', activeSceneId: null };
        }
    };
    const clear = () => {
        if (typeof window === 'undefined')
            return;
        localStorage.removeItem(STORAGE_KEY);
    };
    return {
        save,
        load,
        clear,
        lastSavedAt
    };
}
//# sourceMappingURL=usePatternStorage.client.js.map