import { defineStore } from 'pinia';
import { markRaw } from 'vue';
import { getFileSystemRepository } from '../services/fileSystemRepository';
import { getLibraryRepository } from '../services/libraryRepository';
import { useRecentFiles } from '../composables/useRecentFiles';
import { useSamplePreview } from '../composables/useSamplePreview.client';
import { useQuickBrowse } from '../composables/useQuickBrowse';
const emptyListing = { dirs: [], files: [] };
const createInitialFilters = () => ({
    fileType: 'all',
    contentType: 'all',
    tags: [],
    favorites: false
});
const normalizeTags = (tags) => (tags ?? []).map((tag) => tag.trim().toLowerCase()).filter((tag) => tag.length > 0);
const matchesFilters = (item, filters) => {
    if (filters.fileType && filters.fileType !== 'all' && item.fileType !== filters.fileType)
        return false;
    if (filters.contentType && filters.contentType !== 'all' && item.contentType !== filters.contentType) {
        return false;
    }
    if (filters.category && item.category !== filters.category)
        return false;
    if (filters.product && item.product !== filters.product)
        return false;
    if (filters.bank && item.bank !== filters.bank)
        return false;
    if (filters.subBank && item.subBank !== filters.subBank)
        return false;
    if (filters.character && item.character !== filters.character)
        return false;
    if (filters.favorites && item.favorites !== true)
        return false;
    if (filters.tags && filters.tags.length > 0) {
        const requiredTags = normalizeTags(filters.tags);
        const itemTags = normalizeTags(item.tags);
        const hasAllTags = requiredTags.every((tag) => itemTags.includes(tag));
        if (!hasAllTags)
            return false;
    }
    return true;
};
const describeFilters = (filters) => {
    const parts = [];
    if (filters.fileType && filters.fileType !== 'all')
        parts.push(`Type: ${filters.fileType}`);
    if (filters.contentType && filters.contentType !== 'all')
        parts.push(`Content: ${filters.contentType}`);
    if (filters.category)
        parts.push(`Cat: ${filters.category}`);
    if (filters.product)
        parts.push(`Prod: ${filters.product}`);
    if (filters.bank)
        parts.push(`Bank: ${filters.bank}`);
    if (filters.subBank)
        parts.push(`Sub: ${filters.subBank}`);
    if (filters.tags && filters.tags.length > 0)
        parts.push(`Tags: ${filters.tags.join(', ')}`);
    if (filters.favorites)
        parts.push('Favs');
    return parts.join(', ');
};
const mapLibraryItemToResult = (item, isFavorite) => ({
    id: item.id,
    title: item.name,
    ...(item.tags && item.tags.length > 0 ? { subtitle: item.tags.join(', '), tags: item.tags } : {}),
    ...(item.path ? { path: item.path } : {}),
    ...(item.importedAt ? { importedAt: item.importedAt } : {}),
    ...(item.fileType ? { fileType: item.fileType } : {}),
    ...(item.contentType ? { contentType: item.contentType } : {}),
    ...(item.category ? { category: item.category } : {}),
    ...(item.product ? { product: item.product } : {}),
    ...(item.bank ? { bank: item.bank } : {}),
    ...(item.subBank ? { subBank: item.subBank } : {}),
    ...(item.character ? { character: item.character } : {}),
    ...(isFavorite ? { favorites: true } : {})
});
const mapRecentType = (extension) => {
    if (!extension)
        return 'sample';
    const normalized = extension.toLowerCase();
    if (normalized === 'kit')
        return 'kit';
    if (normalized === 'pattern')
        return 'pattern';
    if (normalized === 'preset')
        return 'preset';
    return 'sample';
};
const sortStorageKey = 'drumcomputer_sort_mode_v1';
const hasClientStorage = () => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined')
        return false;
    return true;
};
const loadSortMode = () => {
    if (!hasClientStorage())
        return 'relevance';
    try {
        const raw = localStorage.getItem(sortStorageKey);
        if (!raw)
            return 'relevance';
        const value = raw;
        if (['name-asc', 'name-desc', 'date-asc', 'date-desc', 'relevance'].includes(value)) {
            return value;
        }
    }
    catch {
        // ignore
    }
    return 'relevance';
};
const persistSortMode = (mode) => {
    if (!hasClientStorage())
        return;
    try {
        localStorage.setItem(sortStorageKey, mode);
    }
    catch {
        // ignore
    }
};
const sortLabel = (mode) => {
    switch (mode) {
        case 'name-asc':
            return 'Name ↑';
        case 'name-desc':
            return 'Name ↓';
        case 'date-asc':
            return 'Date ↑';
        case 'date-desc':
            return 'Date ↓';
        default:
            return 'Relevance';
    }
};
const searchDebounceMs = 300;
const emptyPreviewState = {
    isPlaying: false,
    currentFile: null,
    progress: 0,
    duration: 0
};
const collectTags = (items) => {
    const tags = new Set();
    items.forEach((item) => {
        item.tags?.forEach((tag) => {
            const trimmed = tag.trim();
            if (trimmed.length > 0)
                tags.add(trimmed);
        });
    });
    return Array.from(tags).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
};
export const useBrowserStore = defineStore('browser', {
    state: () => ({
        mode: 'LIBRARY',
        library: {
            query: '',
            results: [],
            rawResults: [],
            selectedId: null
        },
        files: {
            currentPath: '/',
            entries: emptyListing,
            rawEntries: emptyListing,
            selectedPath: null
        },
        filters: createInitialFilters(),
        availableCategories: [],
        availableProducts: [],
        availableBanks: [],
        availableSubBanks: [],
        recentEntries: [],
        availableTags: [],
        tagDialogOpen: false,
        tagDialogItemId: null,
        sortMode: loadSortMode(),
        hierarchyCacheVersion: 0,
        hierarchyCache: {
            version: 0,
            categories: null,
            products: {},
            banks: {},
            subBanks: {}
        },
        searchDebounceId: null,
        preview: null
    }),
    getters: {
        recentFiles(state) {
            return state.recentEntries;
        },
        previewState(state) {
            return state.preview?.state ?? emptyPreviewState;
        }
    },
    actions: {
        ensurePreview() {
            if (!this.preview) {
                this.preview = markRaw(useSamplePreview());
            }
            return this.preview;
        },
        async setMode(mode) {
            this.mode = mode;
            if (mode === 'LIBRARY') {
                await this.loadAvailableTags();
                await this.search();
            }
            else {
                await this.listDir(this.files.currentPath || '/');
            }
        },
        async setQuery(query) {
            this.library.query = query;
            if (this.searchDebounceId) {
                clearTimeout(this.searchDebounceId);
            }
            this.searchDebounceId = setTimeout(() => {
                void this.search();
            }, searchDebounceMs);
        },
        async search() {
            const repo = getLibraryRepository();
            const favorites = await repo.getFavorites();
            const favoriteIds = new Set(favorites.map((item) => item.id));
            const results = this.filters.favorites === true ? favorites : await repo.search(this.library.query ?? '', this.filters);
            const mapped = results.map((item) => mapLibraryItemToResult(item, favoriteIds.has(item.id)));
            const filtered = mapped.filter((item) => matchesFilters(item, this.filters));
            this.library.rawResults = filtered;
            this.library.results = filtered;
            if (this.library.selectedId && !filtered.find((entry) => entry.id === this.library.selectedId)) {
                this.library.selectedId = null;
            }
            await this.refreshHierarchyOptions();
            this.sortResults();
        },
        setFilter(key, value) {
            const nextValue = Array.isArray(value) ? [...value] : value;
            const nextFilters = { ...this.filters, [key]: nextValue };
            if (key === 'category') {
                delete nextFilters.product;
                delete nextFilters.bank;
                delete nextFilters.subBank;
            }
            if (key === 'product') {
                delete nextFilters.bank;
                delete nextFilters.subBank;
            }
            if (key === 'bank') {
                delete nextFilters.subBank;
            }
            this.filters = nextFilters;
            void this.applyFilters();
        },
        async clearFilters() {
            this.filters = createInitialFilters();
            await this.applyFilters();
        },
        async applyFilters() {
            await this.search();
        },
        getAvailableOptions(filterKey) {
            switch (filterKey) {
                case 'fileType':
                    return ['all', 'sample', 'kit', 'pattern', 'preset'];
                case 'contentType':
                    return ['all', 'factory', 'user'];
                case 'category':
                    return this.availableCategories;
                case 'product':
                    return this.availableProducts;
                case 'bank':
                    return this.availableBanks;
                case 'subBank':
                    return this.availableSubBanks;
                default:
                    return [];
            }
        },
        async refreshHierarchyOptions() {
            const repo = getLibraryRepository();
            const version = this.hierarchyCacheVersion;
            if (this.hierarchyCache.version !== version) {
                this.hierarchyCache = {
                    version,
                    categories: null,
                    products: {},
                    banks: {},
                    subBanks: {}
                };
            }
            if (!this.hierarchyCache.categories) {
                this.hierarchyCache.categories = (await repo.getCategories?.()) ?? [];
            }
            const productKey = this.filters.category ?? '';
            if (!this.hierarchyCache.products[productKey]) {
                this.hierarchyCache.products[productKey] = (await repo.getProducts?.(this.filters.category)) ?? [];
            }
            const bankKey = this.filters.product ?? '';
            if (!this.hierarchyCache.banks[bankKey]) {
                this.hierarchyCache.banks[bankKey] = (await repo.getBanks?.(this.filters.product)) ?? [];
            }
            const subBankKey = this.filters.bank ?? '';
            if (!this.hierarchyCache.subBanks[subBankKey]) {
                this.hierarchyCache.subBanks[subBankKey] = (await repo.getSubBanks?.(this.filters.bank)) ?? [];
            }
            this.availableCategories = this.hierarchyCache.categories ?? [];
            this.availableProducts = this.hierarchyCache.products[productKey] ?? [];
            this.availableBanks = this.hierarchyCache.banks[bankKey] ?? [];
            this.availableSubBanks = this.hierarchyCache.subBanks[subBankKey] ?? [];
        },
        invalidateHierarchyCache() {
            this.hierarchyCacheVersion += 1;
        },
        getEncoderFields() {
            if (this.tagDialogOpen) {
                return this.availableTags.map((tag, index) => ({
                    id: `tag-${index}`,
                    label: tag,
                    value: tag
                }));
            }
            const fields = [
                {
                    id: 'fileType',
                    label: 'Type',
                    value: this.filters.fileType ?? 'all',
                    options: this.getAvailableOptions('fileType')
                },
                {
                    id: 'contentType',
                    label: 'Factory/User',
                    value: this.filters.contentType ?? 'all',
                    options: this.getAvailableOptions('contentType')
                },
                {
                    id: 'category',
                    label: 'Category',
                    value: this.filters.category ?? '',
                    options: this.getAvailableOptions('category')
                },
                {
                    id: 'product',
                    label: 'Product',
                    value: this.filters.product ?? '',
                    options: this.getAvailableOptions('product')
                },
                {
                    id: 'bank',
                    label: 'Bank',
                    value: this.filters.bank ?? '',
                    options: this.getAvailableOptions('bank')
                },
                {
                    id: 'subBank',
                    label: 'Sub Bank',
                    value: this.filters.subBank ?? '',
                    options: this.getAvailableOptions('subBank')
                },
                {
                    id: 'tags',
                    label: 'Tags',
                    value: (this.filters.tags ?? []).join(', ')
                },
                {
                    id: 'favorites',
                    label: 'Favorites',
                    value: this.filters.favorites ? 'on' : 'off',
                    options: ['off', 'on']
                }
            ];
            if (this.mode === 'FILES') {
                fields.push({
                    id: 'sort',
                    label: 'Sort',
                    value: sortLabel(this.sortMode),
                    options: ['Name ↑', 'Name ↓', 'Date ↑', 'Date ↓']
                });
            }
            return fields;
        },
        async selectResult(id) {
            this.library.selectedId = id;
        },
        async loadAvailableTags() {
            const repo = getLibraryRepository();
            const items = await repo.search('', undefined);
            const mapped = items.map((item) => mapLibraryItemToResult(item, false));
            this.availableTags = collectTags(mapped);
        },
        async openTagDialog(itemId) {
            this.tagDialogOpen = true;
            this.tagDialogItemId = itemId;
            await this.loadAvailableTags();
            await this.selectResult(itemId);
        },
        closeTagDialog() {
            this.tagDialogOpen = false;
            this.tagDialogItemId = null;
        },
        async addTagToSelected(tag) {
            const itemId = this.tagDialogItemId ?? this.library.selectedId;
            if (!itemId)
                return;
            const repo = getLibraryRepository();
            await repo.addTag(itemId, tag);
            await this.search();
            await this.loadAvailableTags();
            await this.selectResult(itemId);
        },
        async removeTagFromSelected(tag) {
            const itemId = this.tagDialogItemId ?? this.library.selectedId;
            if (!itemId)
                return;
            const repo = getLibraryRepository();
            await repo.removeTag(itemId, tag);
            await this.search();
            await this.loadAvailableTags();
            await this.selectResult(itemId);
        },
        getAvailableTags() {
            return this.availableTags;
        },
        loadRecentFiles() {
            const recent = useRecentFiles();
            const entries = recent.getRecent();
            this.recentEntries = entries;
            const mapped = entries.map((entry) => ({
                id: entry.id,
                title: entry.name,
                subtitle: entry.path,
                path: entry.path,
                timestamp: entry.timestamp
            }));
            this.library.rawResults = mapped;
            this.library.results = mapped;
            this.sortResults();
        },
        async addTag(tag) {
            if (!this.library.selectedId)
                return;
            const repo = getLibraryRepository();
            await repo.addTag(this.library.selectedId, tag);
            await this.search();
        },
        async toggleFavorite(itemId) {
            const repo = getLibraryRepository();
            const isFavorite = await repo.isFavorite(itemId);
            if (isFavorite) {
                await repo.removeFromFavorites(itemId);
            }
            else {
                await repo.addToFavorites(itemId);
            }
            await this.search();
        },
        setSortMode(mode) {
            this.sortMode = mode;
            persistSortMode(mode);
            this.sortResults();
        },
        sortResults() {
            const mode = this.sortMode;
            if (mode === 'relevance') {
                this.library.results = [...this.library.rawResults];
                this.files.entries = {
                    dirs: [...this.files.rawEntries.dirs],
                    files: [...this.files.rawEntries.files]
                };
                return;
            }
            const nameSort = (a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' });
            const dateValue = (value) => (typeof value === 'number' ? value : 0);
            const sortedResults = [...this.library.rawResults].sort((a, b) => {
                if (mode === 'name-asc')
                    return nameSort(a.title, b.title);
                if (mode === 'name-desc')
                    return nameSort(b.title, a.title);
                const dateA = dateValue(a.importedAt ?? a.timestamp);
                const dateB = dateValue(b.importedAt ?? b.timestamp);
                return mode === 'date-asc' ? dateA - dateB : dateB - dateA;
            });
            const sortedDirs = [...this.files.rawEntries.dirs].sort((a, b) => {
                if (mode === 'name-asc')
                    return nameSort(a.name, b.name);
                if (mode === 'name-desc')
                    return nameSort(b.name, a.name);
                return 0;
            });
            const sortedFiles = [...this.files.rawEntries.files].sort((a, b) => {
                if (mode === 'name-asc')
                    return nameSort(a.name, b.name);
                if (mode === 'name-desc')
                    return nameSort(b.name, a.name);
                return 0;
            });
            if (mode === 'date-asc' || mode === 'date-desc') {
                const fallback = mode === 'date-asc' ? 1 : -1;
                sortedDirs.sort((a, b) => nameSort(a.name, b.name) * fallback);
                sortedFiles.sort((a, b) => nameSort(a.name, b.name) * fallback);
            }
            this.library.results = sortedResults;
            this.files.entries = { dirs: sortedDirs, files: sortedFiles };
        },
        async removeTag(tag) {
            if (!this.library.selectedId)
                return;
            const repo = getLibraryRepository();
            await repo.removeTag(this.library.selectedId, tag);
            await this.search();
        },
        async listDir(path) {
            const repo = getFileSystemRepository();
            this.files.currentPath = path || '/';
            this.files.entries = await repo.listDir(this.files.currentPath);
            this.files.rawEntries = this.files.entries;
            if (this.files.selectedPath && !this.files.entries.files.find((file) => file.path === this.files.selectedPath)) {
                this.files.selectedPath = null;
            }
            this.sortResults();
        },
        selectPath(path) {
            this.files.selectedPath = path;
        },
        async importSelected(context) {
            if (!this.files.selectedPath)
                return;
            const fileRepo = getFileSystemRepository();
            const recent = useRecentFiles();
            const repo = getLibraryRepository();
            const meta = await fileRepo.readFileMeta(this.files.selectedPath);
            await repo.importFile(this.files.selectedPath, { name: meta.name });
            recent.addRecent({
                id: this.files.selectedPath,
                path: this.files.selectedPath,
                name: meta.name,
                type: mapRecentType(meta.extension)
            });
            const quickBrowse = useQuickBrowse();
            quickBrowse.recordBrowse({
                mode: this.mode,
                query: this.library.query,
                filters: this.filters,
                selectedId: this.library.selectedId,
                contextType: context?.contextType ?? 'sample',
                contextId: context?.contextId ?? 'global'
            });
            this.loadRecentFiles();
            this.invalidateHierarchyCache();
            await this.loadAvailableTags();
            await repo.refreshIndex();
            await this.search();
        },
        openQuickBrowse(contextId) {
            const quickBrowse = useQuickBrowse();
            const entry = quickBrowse.getLastBrowse(contextId);
            if (entry) {
                quickBrowse.restoreBrowse(entry);
            }
        },
        async prehearSelected() {
            const preview = this.ensurePreview();
            const fileRepo = getFileSystemRepository();
            if (this.mode === 'FILES') {
                if (!this.files.selectedPath)
                    return;
                const blob = await fileRepo.readFileBlob?.(this.files.selectedPath);
                await preview.loadAndPlay(this.files.selectedPath, blob);
                return;
            }
            if (this.library.selectedId) {
                const selected = this.library.results.find((item) => item.id === this.library.selectedId);
                if (!selected?.path)
                    return;
                const blob = await fileRepo.readFileBlob?.(selected.path);
                await preview.loadAndPlay(selected.path, blob);
            }
        },
        stopPrehear() {
            this.preview?.stop();
        },
        toDisplayModels() {
            const sortSummary = this.sortMode === 'relevance' ? '' : `Sorted by ${sortLabel(this.sortMode)}`;
            if (this.tagDialogOpen) {
                const selectedId = this.tagDialogItemId ?? this.library.selectedId;
                const selected = this.library.results.find((item) => item.id === selectedId);
                const selectedTags = selected?.tags ?? [];
                const leftItems = this.availableTags.map((tag) => ({
                    title: tag,
                    subtitle: selectedTags.includes(tag) ? '[x]' : '[ ]'
                }));
                const rightItems = selectedTags.map((tag) => ({
                    title: tag,
                    subtitle: 'Remove'
                }));
                return {
                    leftModel: {
                        view: 'BROWSER',
                        title: 'Add Tag',
                        summary: `${selectedTags.length} tags`,
                        items: leftItems
                    },
                    rightModel: {
                        view: 'BROWSER',
                        title: 'Current Tags',
                        summary: 'Press to toggle',
                        items: rightItems
                    }
                };
            }
            if (this.mode === 'FILES') {
                const leftItems = this.files.entries.dirs.map((dir) => ({
                    title: dir.name,
                    subtitle: dir.path
                }));
                const rightItems = this.files.entries.files.map((file) => ({
                    title: file.name,
                    subtitle: file.path,
                    active: file.path === this.files.selectedPath
                }));
                return {
                    leftModel: {
                        view: 'FILE',
                        title: 'Directories',
                        summary: this.files.currentPath,
                        items: leftItems
                    },
                    rightModel: {
                        view: 'FILE',
                        title: 'Files',
                        summary: [sortSummary || null, 'Select a file to import'].filter(Boolean).join(' • '),
                        items: rightItems
                    }
                };
            }
            const leftItems = [
                {
                    title: 'Search',
                    subtitle: [this.library.query || 'All', describeFilters(this.filters)].filter(Boolean).join(' • ')
                }
            ];
            const results = this.library.results;
            const selectedIndex = results.findIndex((result) => result.id === this.library.selectedId);
            const maxItems = 100;
            let start = 0;
            if (results.length > maxItems) {
                const targetIndex = selectedIndex >= 0 ? selectedIndex : 0;
                start = Math.max(0, Math.min(results.length - maxItems, targetIndex - Math.floor(maxItems / 3)));
            }
            const windowedResults = results.slice(start, start + maxItems);
            const rightItems = windowedResults.map((result) => {
                const subtitle = result.subtitle;
                const decoratedSubtitle = result.favorites ? `${subtitle ? `${subtitle} ` : ''}★` : subtitle;
                const entry = {
                    title: result.title,
                    active: result.id === this.library.selectedId,
                    value: result.id
                };
                if (decoratedSubtitle) {
                    entry.subtitle = decoratedSubtitle;
                }
                return entry;
            });
            const leftSummary = [this.library.query || 'All', describeFilters(this.filters), sortSummary || null]
                .filter(Boolean)
                .join(' • ');
            return {
                leftModel: {
                    view: 'BROWSER',
                    title: 'Library',
                    summary: leftSummary,
                    items: leftItems
                },
                rightModel: {
                    view: 'BROWSER',
                    title: 'Results',
                    summary: `${rightItems.length} items`,
                    items: rightItems
                }
            };
        }
    }
});
//# sourceMappingURL=browser.js.map