import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useBrowserStore } from '../../stores/browser';
import { __setLibraryRepositoryForTests } from '../../services/libraryRepository';
import { __setFileSystemRepositoryForTests } from '../../services/fileSystemRepository';
class MemoryLibraryRepo {
    items;
    constructor(items = []) {
        this.items = items;
    }
    favorites = new Set();
    async search(query, filters) {
        const term = query.trim().toLowerCase();
        const matchesQuery = (item) => {
            if (!term)
                return true;
            return item.name.toLowerCase().includes(term);
        };
        const matchesFilters = (item) => {
            if (!filters)
                return true;
            if (filters.fileType && filters.fileType !== 'all' && item.fileType !== filters.fileType)
                return false;
            if (filters.contentType && filters.contentType !== 'all' && item.contentType !== filters.contentType)
                return false;
            if (filters.category && item.category !== filters.category)
                return false;
            if (filters.product && item.product !== filters.product)
                return false;
            if (filters.bank && item.bank !== filters.bank)
                return false;
            if (filters.tags && filters.tags.length > 0) {
                const normalizedTags = filters.tags.map((tag) => tag.trim().toLowerCase()).filter((tag) => tag.length > 0);
                const itemTags = (item.tags ?? []).map((tag) => tag.trim().toLowerCase());
                if (!normalizedTags.every((tag) => itemTags.includes(tag)))
                    return false;
            }
            if (filters.favorites && item.favorites !== true)
                return false;
            return true;
        };
        return this.items.filter((item) => matchesQuery(item) && matchesFilters(item));
    }
    async getItem(id) {
        return this.items.find((item) => item.id === id);
    }
    async getTags(itemId) {
        return (await this.getItem(itemId))?.tags ?? [];
    }
    async addTag(itemId, tag) {
        this.items = this.items.map((item) => item.id === itemId ? { ...item, tags: [...item.tags, tag] } : item);
        return this.getTags(itemId);
    }
    async removeTag(itemId, tag) {
        this.items = this.items.map((item) => item.id === itemId ? { ...item, tags: item.tags.filter((value) => value !== tag) } : item);
        return this.getTags(itemId);
    }
    importCalls = [];
    async importFile(path, meta) {
        this.importCalls.push(path);
        const item = {
            id: meta?.id ?? path,
            name: meta?.name ?? path,
            tags: meta?.tags ?? [],
            path
        };
        this.items.push(item);
        return item;
    }
    async refreshIndex() {
        // no-op for in-memory
    }
    async addToFavorites(itemId) {
        this.favorites.add(itemId);
    }
    async removeFromFavorites(itemId) {
        this.favorites.delete(itemId);
    }
    async getFavorites() {
        return this.items.filter((item) => this.favorites.has(item.id));
    }
    async isFavorite(itemId) {
        return this.favorites.has(itemId);
    }
    async importDirectory() {
        return;
    }
}
class MemoryFileRepo {
    listing;
    constructor(listing) {
        this.listing = listing;
    }
    async listDir(_path) {
        return this.listing;
    }
    async stat(_path) {
        return { isDir: false };
    }
    async readFileMeta(path) {
        const name = path.split('/').pop() ?? path;
        const ext = name.includes('.') ? name.split('.').pop() : undefined;
        const meta = { name };
        if (ext) {
            meta.extension = ext;
        }
        return meta;
    }
}
describe('browser store', () => {
    let libraryRepo;
    let fileRepo;
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.useFakeTimers();
        libraryRepo = new MemoryLibraryRepo([
            {
                id: '1',
                name: 'Kick One',
                tags: ['drum'],
                fileType: 'sample',
                contentType: 'factory',
                category: 'drums',
                product: 'Kit A',
                bank: 'A',
                favorites: false
            },
            {
                id: '2',
                name: 'Snare Tight',
                tags: ['snare', 'tight'],
                fileType: 'sample',
                contentType: 'factory',
                category: 'drums',
                product: 'Kit A',
                bank: 'B',
                favorites: true
            },
            {
                id: '3',
                name: 'Pad Warm',
                tags: ['pad'],
                fileType: 'preset',
                contentType: 'user',
                category: 'synth',
                product: 'Pads',
                bank: 'Main',
                favorites: false
            }
        ]);
        fileRepo = new MemoryFileRepo({
            dirs: [{ name: 'kits', path: '/kits' }],
            files: [{ name: 'new.wav', path: '/kits/new.wav' }]
        });
        __setLibraryRepositoryForTests(libraryRepo);
        __setFileSystemRepositoryForTests(fileRepo);
    });
    afterEach(() => {
        vi.runOnlyPendingTimers();
        vi.useRealTimers();
    });
    it('keeps library and files state separated on mode switch', async () => {
        const store = useBrowserStore();
        await store.setQuery('Kick');
        vi.advanceTimersByTime(350);
        await Promise.resolve();
        expect(store.library.results).toHaveLength(1);
        await store.setMode('FILES');
        expect(store.files.entries.files).toHaveLength(1);
        expect(store.library.query).toBe('Kick');
        await store.setMode('LIBRARY');
        expect(store.library.results).toHaveLength(1);
    });
    it('updates search results when query changes', async () => {
        const store = useBrowserStore();
        await store.setQuery('snare');
        vi.advanceTimersByTime(350);
        await Promise.resolve();
        expect(store.library.results[0]?.title).toContain('Snare');
    });
    it('persists tag changes through repository', async () => {
        const store = useBrowserStore();
        await store.search();
        await store.selectResult('1');
        await store.addTag('punch');
        expect(await libraryRepo.getTags('1')).toContain('punch');
        await store.removeTag('punch');
        expect(await libraryRepo.getTags('1')).not.toContain('punch');
    });
    it('lists directories and files for the current path', async () => {
        const store = useBrowserStore();
        await store.setMode('FILES');
        expect(store.files.entries.dirs[0]?.name).toBe('kits');
        expect(store.files.entries.files[0]?.name).toBe('new.wav');
    });
    it('imports selected file into library and refreshes search results', async () => {
        const store = useBrowserStore();
        await store.setMode('FILES');
        store.selectPath('/kits/new.wav');
        await store.importSelected();
        await store.setMode('LIBRARY');
        await store.search();
        expect(libraryRepo.importCalls).toContain('/kits/new.wav');
        expect(store.library.results.find((item) => item.title.includes('new.wav'))).toBeDefined();
    });
    it('applies filters to search results', async () => {
        const store = useBrowserStore();
        await store.search();
        store.setFilter('fileType', 'preset');
        await store.applyFilters();
        expect(store.library.results).toHaveLength(1);
        expect(store.library.results[0]?.title).toBe('Pad Warm');
    });
    it('combines multiple filters when searching', async () => {
        const store = useBrowserStore();
        await store.search();
        store.setFilter('fileType', 'sample');
        store.setFilter('favorites', true);
        store.setFilter('category', 'drums');
        await store.applyFilters();
        expect(store.library.results).toHaveLength(1);
        expect(store.library.results[0]?.title).toBe('Snare Tight');
    });
    it('builds encoder fields in the expected order', () => {
        const store = useBrowserStore();
        const fields = store.getEncoderFields();
        expect(fields.map((field) => field.id)).toEqual([
            'fileType',
            'contentType',
            'category',
            'product',
            'bank',
            'tags',
            'favorites'
        ]);
        expect(fields[0]?.options).toContain('sample');
        expect(fields[6]?.value).toBe('off');
    });
});
//# sourceMappingURL=browserStore.spec.js.map