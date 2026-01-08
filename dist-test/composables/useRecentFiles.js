const maxRecent = 50;
const storageKey = 'drumcomputer_recent_files_v1';
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
            .filter((entry) => entry && typeof entry.id === 'string' && typeof entry.timestamp === 'number')
            .map((entry) => ({
            id: String(entry.id),
            path: String(entry.path ?? ''),
            name: String(entry.name ?? ''),
            timestamp: Number(entry.timestamp),
            type: entry.type ?? 'sample'
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
        // ignore storage errors (quota etc.)
    }
};
const sortByTimestamp = (entries) => [...entries].sort((a, b) => b.timestamp - a.timestamp);
export function useRecentFiles() {
    function addRecent(entry) {
        if (!hasClientStorage())
            return;
        const timestamp = Date.now();
        const existing = readStorage().filter((item) => item.id !== entry.id);
        const next = sortByTimestamp([{ ...entry, timestamp }, ...existing]).slice(0, maxRecent);
        writeStorage(next);
    }
    function getRecent(limit) {
        const entries = sortByTimestamp(readStorage());
        if (limit && limit > 0)
            return entries.slice(0, limit);
        return entries;
    }
    function clearRecent() {
        if (!hasClientStorage())
            return;
        writeStorage([]);
    }
    function removeRecent(id) {
        if (!hasClientStorage())
            return;
        const next = readStorage().filter((entry) => entry.id !== id);
        writeStorage(next);
    }
    return { addRecent, getRecent, clearRecent, removeRecent };
}
//# sourceMappingURL=useRecentFiles.js.map