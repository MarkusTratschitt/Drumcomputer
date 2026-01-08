import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useRecentFiles } from '../../composables/useRecentFiles';
describe('useRecentFiles', () => {
    beforeEach(() => {
        if (typeof localStorage !== 'undefined') {
            localStorage.clear();
        }
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });
    it('deduplicates entries and moves them to the front', () => {
        const recent = useRecentFiles();
        vi.spyOn(Date, 'now').mockReturnValueOnce(1000).mockReturnValueOnce(2000);
        recent.addRecent({ id: 'a', path: '/a.wav', name: 'A', type: 'sample' });
        recent.addRecent({ id: 'a', path: '/a.wav', name: 'A', type: 'sample' });
        const entries = recent.getRecent();
        expect(entries).toHaveLength(1);
        expect(entries[0]?.timestamp).toBe(2000);
    });
    it('caps the recent list to the max limit', () => {
        const recent = useRecentFiles();
        const nowSpy = vi.spyOn(Date, 'now');
        for (let i = 0; i < 55; i += 1) {
            nowSpy.mockReturnValueOnce(1000 + i);
            recent.addRecent({ id: String(i), path: `/file-${i}.wav`, name: `File ${i}`, type: 'sample' });
        }
        const entries = recent.getRecent();
        expect(entries).toHaveLength(50);
        expect(entries[0]?.id).toBe('54');
    });
    it('sorts by timestamp descending', () => {
        const recent = useRecentFiles();
        vi.spyOn(Date, 'now').mockReturnValueOnce(1000).mockReturnValueOnce(3000).mockReturnValueOnce(2000);
        recent.addRecent({ id: 'first', path: '/first.wav', name: 'First', type: 'sample' });
        recent.addRecent({ id: 'third', path: '/third.wav', name: 'Third', type: 'sample' });
        recent.addRecent({ id: 'second', path: '/second.wav', name: 'Second', type: 'sample' });
        const entries = recent.getRecent();
        expect(entries.map((entry) => entry.id)).toEqual(['third', 'second', 'first']);
    });
    it('persists entries to localStorage', () => {
        const recent = useRecentFiles();
        vi.spyOn(Date, 'now').mockReturnValueOnce(5000);
        const entry = {
            id: 'persist',
            path: '/persist.wav',
            name: 'Persist',
            type: 'sample'
        };
        recent.addRecent(entry);
        const reloaded = useRecentFiles();
        const entries = reloaded.getRecent();
        expect(entries).toHaveLength(1);
        expect(entries[0]?.id).toBe('persist');
        expect(entries[0]?.timestamp).toBe(5000);
    });
});
//# sourceMappingURL=recentFiles.spec.js.map