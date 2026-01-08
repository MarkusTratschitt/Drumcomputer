import { ref } from 'vue';
const maxHistory = 50;
const storageKey = 'drumcomputer_quick_browse_v1';
const hasClientStorage = () => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined')
        return false;
    if (typeof import.meta !== 'undefined' && 'client' in import.meta && !import.meta.client)
        return false;
    return true;
};
const readStorage = () => {
    if (!hasClientStorage())
        return [];
    try {
        const raw = localStorage.getItem(storageKey);
        if (!raw)
            return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed))
            return [];
        return parsed
            .filter((entry) => entry && typeof entry.contextId === 'string' && typeof entry.timestamp === 'number')
            .map((entry) => ({
            timestamp: Number(entry.timestamp),
            mode: entry.mode,
            query: String(entry.query ?? ''),
            filters: (entry.filters ?? {}),
            selectedId: entry.selectedId ?? null,
            contextType: entry.contextType,
            contextId: String(entry.contextId)
        }));
    }
    catch {
        return [];
    }
};
const writeStorage = (entries) => {
    if (!hasClientStorage())
        return;
    try {
        localStorage.setItem(storageKey, JSON.stringify(entries));
    }
    catch {
        // ignore storage errors
    }
};
const sortHistory = (entries) => [...entries].sort((a, b) => b.timestamp - a.timestamp);
export function useQuickBrowse() {
    const history = ref(sortHistory(readStorage()));
    function recordBrowse(entry) {
        if (!hasClientStorage())
            return;
        const timestamp = Date.now();
        const withoutContext = history.value.filter((item) => item.contextId !== entry.contextId);
        const next = sortHistory([{ ...entry, timestamp }, ...withoutContext]).slice(0, maxHistory);
        history.value = next;
        writeStorage(next);
    }
    function getLastBrowse(contextId) {
        return history.value.find((entry) => entry.contextId === contextId) ?? null;
    }
    function restoreBrowse(entry) {
        void import('../stores/browser').then(async ({ useBrowserStore }) => {
            const browser = useBrowserStore();
            await browser.setMode(entry.mode);
            browser.filters = { ...entry.filters };
            browser.library.query = entry.query;
            await browser.search();
            if (entry.selectedId) {
                await browser.selectResult(entry.selectedId);
            }
        });
    }
    function clearHistory() {
        history.value = [];
        writeStorage([]);
    }
    return { history, recordBrowse, getLastBrowse, restoreBrowse, clearHistory };
}
//# sourceMappingURL=useQuickBrowse.js.map