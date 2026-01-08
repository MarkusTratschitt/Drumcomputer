import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { __resetLibraryRepository, __setLibraryRepositoryForTests, getLibraryRepository } from '../../services/libraryRepository';
import { useBrowserStore } from '../../stores/browser';
class MemoryLibraryRepo {
    items;
    constructor(items = []) {
        this.items = items;
    }
    favorites = new Set();
    async search(query, _filters) {
        const text = query.trim().toLowerCase();
        if (!text)
            return this.items;
        return this.items.filter((item) => item.name.toLowerCase().includes(text));
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
    async importFile(path, meta) {
        const item = {
            id: meta?.id ?? path,
            name: meta?.name ?? path,
            tags: meta?.tags ?? [],
            path,
            ...meta
        };
        this.items.push(item);
        return item;
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
    async refreshIndex() {
        return;
    }
    async importDirectory() {
        return;
    }
}
describe('favorites', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        __resetLibraryRepository();
        if (typeof localStorage !== 'undefined') {
            localStorage.clear();
        }
    });
    afterEach(() => {
        __resetLibraryRepository();
    });
    it('adds/removes favorites and persists them', async () => {
        const repo = getLibraryRepository();
        await repo.importFile('/kick.wav', { id: 'kick', name: 'Kick', tags: [] });
        await repo.addToFavorites('kick');
        expect(await repo.isFavorite('kick')).toBe(true);
        const favorites = await repo.getFavorites();
        expect(favorites.map((item) => item.id)).toContain('kick');
        __resetLibraryRepository();
        const reloaded = getLibraryRepository();
        expect(await reloaded.isFavorite('kick')).toBe(true);
        await reloaded.removeFromFavorites('kick');
        expect(await reloaded.isFavorite('kick')).toBe(false);
    });
    it('toggles favorites through the browser store action', async () => {
        const repo = new MemoryLibraryRepo([
            { id: '1', name: 'Kick', tags: [] },
            { id: '2', name: 'Snare', tags: [] }
        ]);
        __setLibraryRepositoryForTests(repo);
        const store = useBrowserStore();
        await store.search();
        await store.toggleFavorite('1');
        expect(await repo.isFavorite('1')).toBe(true);
        expect(store.library.results.find((item) => item.id === '1')?.favorites).toBe(true);
    });
    it('filters results to favorites and marks display subtitles', async () => {
        const repo = new MemoryLibraryRepo([
            { id: '1', name: 'Kick', tags: ['drum'] },
            { id: '2', name: 'Snare', tags: ['drum'] }
        ]);
        await repo.addToFavorites('2');
        __setLibraryRepositoryForTests(repo);
        const store = useBrowserStore();
        store.setFilter('favorites', true);
        await store.search();
        expect(store.library.results).toHaveLength(1);
        expect(store.library.results[0]?.id).toBe('2');
        const display = store.toDisplayModels();
        const subtitle = display.rightModel.items?.[0]?.subtitle ?? '';
        expect(subtitle.includes('★')).toBe(true);
    });
});
//# sourceMappingURL=favorites.spec.js.map