import { describe, it, expect, beforeEach, vi } from 'vitest';
let injectedContext = null;
vi.mock('vue', async () => {
    const actual = await vi.importActual('vue');
    return {
        ...actual,
        inject: () => injectedContext
    };
});
import { useSamplePreview } from '../../composables/useSamplePreview.client';
class MockAudioBufferSourceNode {
    buffer = null;
    onended = null;
    connect() {
        return;
    }
    disconnect() {
        return;
    }
    start() {
        return;
    }
    stop() {
        this.onended?.();
    }
}
class MockAudioContext {
    currentTime = 0;
    state = 'running';
    createBufferSource() {
        return new MockAudioBufferSourceNode();
    }
    async decodeAudioData() {
        return { duration: 4 };
    }
    async resume() {
        this.state = 'running';
    }
    destination = {};
}
describe('useSamplePreview', () => {
    let rafCallback = null;
    beforeEach(() => {
        injectedContext = new MockAudioContext();
        rafCallback = null;
        globalThis.requestAnimationFrame = (cb) => {
            rafCallback = cb;
            return 1;
        };
        globalThis.cancelAnimationFrame = () => {
            rafCallback = null;
        };
    });
    it('loads and plays a blob', async () => {
        const preview = useSamplePreview();
        const blob = new Blob(['test'], { type: 'audio/wav' });
        await preview.loadAndPlay('/audio/test.wav', blob);
        expect(preview.state.isPlaying).toBe(true);
        expect(preview.state.currentFile).toBe('/audio/test.wav');
        expect(preview.state.duration).toBe(4);
    });
    it('stops playback', async () => {
        const preview = useSamplePreview();
        const blob = new Blob(['test'], { type: 'audio/wav' });
        await preview.loadAndPlay('/audio/test.wav', blob);
        preview.stop();
        expect(preview.state.isPlaying).toBe(false);
        expect(preview.state.progress).toBe(0);
    });
    it('tracks progress while playing', async () => {
        const preview = useSamplePreview();
        const blob = new Blob(['test'], { type: 'audio/wav' });
        await preview.loadAndPlay('/audio/test.wav', blob);
        const ctx = injectedContext;
        ctx.currentTime = 2;
        rafCallback?.(0);
        expect(preview.state.progress).toBeGreaterThan(0);
    });
});
//# sourceMappingURL=samplePreview.spec.js.map