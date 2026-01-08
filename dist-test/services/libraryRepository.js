import { getFileSystemRepository } from './fileSystemRepository';
const STORAGE_KEY = 'drumcomputer_library_items_v1';
const FAVORITES_KEY = 'drumcomputer_favorites_v1';
const normalizeTag = (value) => value.trim().toLowerCase();
const supportedExtensions = new Set(['wav', 'wave', 'mp3', 'aiff', 'aif', 'flac', 'ogg']);
const getExtension = (path) => {
    const name = path.split('/').pop() ?? '';
    const parts = name.split('.');
    if (parts.length < 2)
        return '';
    return (parts.pop() ?? '').toLowerCase();
};
const extractMetadataFromPath = (path) => {
    const parts = path.split('/').filter(Boolean);
    return {
        category: parts[0],
        product: parts[1],
        bank: parts[2],
        subBank: parts[3],
        character: parts[4],
        vendor: 'user'
    };
};
const createLocalRepository = () => {
    let items = loadPersisted();
    let favorites = loadFavorites();
    function persist() {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
            }
        }
        catch {
            // ignore persistence errors in non-browser environments
        }
    }
    function loadPersisted() {
        try {
            if (typeof localStorage === 'undefined')
                return [];
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw)
                return [];
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                return parsed.map((entry) => ({
                    ...entry,
                    tags: Array.isArray(entry?.tags) ? entry.tags.map(String) : []
                }));
            }
        }
        catch {
            // ignore
        }
        return [];
    }
    function persistFavorites() {
        try {
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(favorites)));
            }
        }
        catch {
            // ignore
        }
    }
    function loadFavorites() {
        try {
            if (typeof localStorage === 'undefined')
                return new Set();
            const raw = localStorage.getItem(FAVORITES_KEY);
            if (!raw)
                return new Set();
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                return new Set(parsed.map(String));
            }
        }
        catch {
            // ignore
        }
        return new Set();
    }
    return {
        async search(query, _filters) {
            const text = query.trim().toLowerCase();
            if (!text)
                return [...items];
            return items.filter((item) => {
                const haystack = `${item.name} ${item.tags.join(' ')}`.toLowerCase();
                return haystack.includes(text);
            });
        },
        async getItem(id) {
            return items.find((item) => item.id === id);
        },
        async getTags(itemId) {
            return (await this.getItem(itemId))?.tags ?? [];
        },
        async addTag(itemId, tag) {
            const normalized = normalizeTag(tag);
            items = items.map((item) => {
                if (item.id !== itemId)
                    return item;
                const tags = new Set(item.tags.map(normalizeTag));
                tags.add(normalized);
                return { ...item, tags: Array.from(tags) };
            });
            persist();
            return (await this.getTags(itemId)) ?? [];
        },
        async removeTag(itemId, tag) {
            const normalized = normalizeTag(tag);
            items = items.map((item) => {
                if (item.id !== itemId)
                    return item;
                return { ...item, tags: item.tags.filter((value) => normalizeTag(value) !== normalized) };
            });
            persist();
            return (await this.getTags(itemId)) ?? [];
        },
        async importFile(path, meta) {
            const id = meta?.id ?? path;
            const existing = items.find((item) => item.id === id);
            const name = meta?.name ?? path.split('/').pop() ?? 'Sample';
            const next = {
                id,
                name,
                path,
                tags: existing?.tags ?? [],
                importedAt: Date.now(),
                ...meta
            };
            if (existing) {
                items = items.map((item) => (item.id === id ? next : item));
            }
            else {
                items = [...items, next];
            }
            persist();
            return next;
        },
        async addToFavorites(itemId) {
            favorites.add(itemId);
            persistFavorites();
        },
        async removeFromFavorites(itemId) {
            favorites.delete(itemId);
            persistFavorites();
        },
        async getFavorites() {
            return items.filter((item) => favorites.has(item.id));
        },
        async isFavorite(itemId) {
            return favorites.has(itemId);
        },
        async getCategories() {
            const values = items.map((item) => item.category).filter((value) => !!value);
            return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
        },
        async getProducts(category) {
            const filtered = category ? items.filter((item) => item.category === category) : items;
            const values = filtered.map((item) => item.product).filter((value) => !!value);
            return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
        },
        async getBanks(product) {
            const filtered = product ? items.filter((item) => item.product === product) : items;
            const values = filtered.map((item) => item.bank).filter((value) => !!value);
            return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
        },
        async getSubBanks(bank) {
            const filtered = bank ? items.filter((item) => item.bank === bank) : items;
            const values = filtered.map((item) => item.subBank).filter((value) => !!value);
            return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
        },
        async refreshIndex() {
            items = loadPersisted();
            favorites = loadFavorites();
        },
        async importDirectory(path, options, onProgress) {
            const repo = getFileSystemRepository();
            const recursive = options?.recursive ?? false;
            const errors = [];
            const filesToImport = [];
            const collectFiles = async (dirPath) => {
                try {
                    const listing = await repo.listDir(dirPath);
                    for (const file of listing.files) {
                        const extension = getExtension(file.path);
                        if (!supportedExtensions.has(extension)) {
                            errors.push(file.path);
                            continue;
                        }
                        filesToImport.push(file.path);
                    }
                    if (recursive) {
                        for (const dir of listing.dirs) {
                            await collectFiles(dir.path);
                        }
                    }
                }
                catch {
                    errors.push(dirPath);
                }
            };
            await collectFiles(path);
            const total = filesToImport.length;
            let completed = 0;
            for (const filePath of filesToImport) {
                try {
                    const meta = extractMetadataFromPath(filePath);
                    await this.importFile(filePath, meta);
                }
                catch {
                    errors.push(filePath);
                }
                completed += 1;
                onProgress?.({ total, completed, current: filePath, errors: [...errors] });
            }
            if (errors.length > 0) {
                console.warn('Import completed with errors', errors);
            }
        }
    };
};
let repository = createLocalRepository();
export const getLibraryRepository = () => repository;
export const __setLibraryRepositoryForTests = (repo) => {
    repository = repo;
};
export const __resetLibraryRepository = () => {
    repository = createLocalRepository();
};
//# sourceMappingURL=libraryRepository.js.map