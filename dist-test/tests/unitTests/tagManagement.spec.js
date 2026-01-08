import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useBrowserStore } from '../../stores/browser';
import { useControlStore } from '../../stores/control';
import { __setLibraryRepositoryForTests } from '../../services/libraryRepository';
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
describe('tag management', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        const repo = new MemoryLibraryRepo([
            { id: '1', name: 'Kick', tags: ['drum', 'kick'] },
            { id: '2', name: 'Snare', tags: ['drum'] }
        ]);
        __setLibraryRepositoryForTests(repo);
    });
    it('opens the tag dialog and loads available tags', async () => {
        const store = useBrowserStore();
        await store.search();
        await store.openTagDialog('1');
        expect(store.tagDialogOpen).toBe(true);
        expect(store.availableTags).toContain('drum');
        expect(store.availableTags).toContain('kick');
    });
    it('adds and removes tags for the selected item', async () => {
        const store = useBrowserStore();
        await store.search();
        await store.openTagDialog('1');
        await store.addTagToSelected('new-tag');
        expect(store.library.results.find((item) => item.id === '1')?.tags).toContain('new-tag');
        await store.removeTagFromSelected('drum');
        expect(store.library.results.find((item) => item.id === '1')?.tags).not.toContain('drum');
        expect(store.availableTags).toContain('new-tag');
    });
    it('uses the encoder to navigate and toggle tags', async () => {
        const browser = useBrowserStore();
        const control = useControlStore();
        await browser.search();
        await browser.openTagDialog('1');
        control.setMode('BROWSER');
        control.syncBrowserDisplay();
        control.turnEncoder4D(1);
        expect(control.encoder4D?.activeListIndex.value).toBe(1);
        const initialTags = browser.library.results.find((item) => item.id === '1')?.tags ?? [];
        await control.pressEncoder4D();
        const updatedTags = browser.library.results.find((item) => item.id === '1')?.tags ?? [];
        expect(updatedTags.length === initialTags.length || updatedTags.length === initialTags.length + 1).toBe(true);
        control.tiltEncoder4D('right');
        expect(browser.tagDialogOpen).toBe(false);
    });
});
//# sourceMappingURL=tagManagement.spec.js.map