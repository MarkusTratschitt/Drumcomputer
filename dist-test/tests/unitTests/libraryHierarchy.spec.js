import { describe, it, expect, beforeEach } from 'vitest';
import { __resetLibraryRepository, getLibraryRepository } from '../../services/libraryRepository';
import { __setFileSystemRepositoryForTests } from '../../services/fileSystemRepository';
import { setActivePinia, createPinia } from 'pinia';
import { useBrowserStore } from '../../stores/browser';
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
        if (ext)
            meta.extension = ext;
        return meta;
    }
}
describe('library hierarchy', () => {
    beforeEach(() => {
        __resetLibraryRepository();
        if (typeof localStorage !== 'undefined') {
            localStorage.clear();
        }
        setActivePinia(createPinia());
    });
    it('returns hierarchical values based on parent filters', async () => {
        const repo = getLibraryRepository();
        await repo.importFile('/Drums/808/Kicks/Deep/kick_01.wav', {
            name: 'kick_01',
            category: 'Drums',
            product: '808',
            bank: 'Kicks',
            subBank: 'Deep',
            vendor: 'user'
        });
        await repo.importFile('/Drums/909/Snares/Loose/snare_01.wav', {
            name: 'snare_01',
            category: 'Drums',
            product: '909',
            bank: 'Snares',
            subBank: 'Loose',
            vendor: 'user'
        });
        const categories = await repo.getCategories?.();
        const products = await repo.getProducts?.('Drums');
        const banks = await repo.getBanks?.('808');
        const subBanks = await repo.getSubBanks?.('Kicks');
        expect(categories).toEqual(['Drums']);
        expect(products).toEqual(['808', '909']);
        expect(banks).toEqual(['Kicks']);
        expect(subBanks).toEqual(['Deep']);
    });
    it('updates filter cascade options in browser store', async () => {
        const repo = getLibraryRepository();
        await repo.importFile('/Drums/808/Kicks/Deep/kick_01.wav', {
            name: 'kick_01',
            category: 'Drums',
            product: '808',
            bank: 'Kicks',
            subBank: 'Deep',
            vendor: 'user'
        });
        await repo.importFile('/Drums/909/Snares/Loose/snare_01.wav', {
            name: 'snare_01',
            category: 'Drums',
            product: '909',
            bank: 'Snares',
            subBank: 'Loose',
            vendor: 'user'
        });
        const store = useBrowserStore();
        await store.search();
        store.setFilter('category', 'Drums');
        await store.applyFilters();
        expect(store.availableProducts).toEqual(['808', '909']);
        store.setFilter('product', '808');
        await store.applyFilters();
        expect(store.availableBanks).toEqual(['Kicks']);
    });
    it('extracts metadata from paths during directory import', async () => {
        __setFileSystemRepositoryForTests(new MemoryFileRepo({
            dirs: [],
            files: [{ name: 'kick_01.wav', path: '/Drums/808/Kicks/Deep/kick_01.wav' }]
        }));
        const repo = getLibraryRepository();
        await repo.importDirectory?.('/', undefined, undefined);
        const items = await repo.search('');
        const entry = items.find((item) => item.path?.includes('kick_01.wav'));
        expect(entry?.category).toBe('Drums');
        expect(entry?.product).toBe('808');
        expect(entry?.bank).toBe('Kicks');
        expect(entry?.subBank).toBe('Deep');
    });
});
//# sourceMappingURL=libraryHierarchy.spec.js.map