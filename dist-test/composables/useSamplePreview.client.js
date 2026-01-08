import { inject, onBeforeUnmount, reactive } from 'vue';
import { getFileSystemRepository } from '../services/fileSystemRepository';
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export function useSamplePreview() {
    const audioContext = inject('audioContext', null);
    const state = reactive({
        isPlaying: false,
        currentFile: null,
        progress: 0,
        duration: 0
    });
    let sourceNode = null;
    let buffer = null;
    let startTime = 0;
    let pausedAt = 0;
    let rafId = 0;
    const cancelProgress = () => {
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = 0;
        }
    };
    const updateProgress = () => {
        if (!audioContext || !buffer || !state.isPlaying)
            return;
        const elapsed = audioContext.currentTime - startTime;
        const duration = buffer.duration || 0;
        state.progress = duration > 0 ? clamp(elapsed / duration, 0, 1) : 0;
        if (state.progress >= 1) {
            stop();
            return;
        }
        rafId = requestAnimationFrame(updateProgress);
    };
    const detachSource = () => {
        if (sourceNode) {
            sourceNode.onended = null;
            try {
                sourceNode.stop();
            }
            catch {
                // ignore
            }
            try {
                sourceNode.disconnect();
            }
            catch {
                // ignore
            }
            sourceNode = null;
        }
    };
    const createSource = () => {
        if (!audioContext || !buffer)
            return;
        const node = audioContext.createBufferSource();
        node.buffer = buffer;
        node.connect(audioContext.destination);
        node.onended = () => {
            if (state.isPlaying) {
                stop();
            }
        };
        sourceNode = node;
    };
    async function loadAndPlay(path, blob) {
        if (!audioContext)
            return;
        stop();
        const repo = getFileSystemRepository();
        const fileBlob = blob ?? (await repo.readFileBlob?.(path));
        if (!fileBlob)
            return;
        const arrayBuffer = await fileBlob.arrayBuffer();
        buffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
        state.duration = buffer?.duration ?? 0;
        state.currentFile = path;
        state.progress = 0;
        pausedAt = 0;
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }
        createSource();
        if (!sourceNode)
            return;
        startTime = audioContext.currentTime;
        sourceNode.start(0);
        state.isPlaying = true;
        cancelProgress();
        rafId = requestAnimationFrame(updateProgress);
    }
    function stop() {
        cancelProgress();
        detachSource();
        state.isPlaying = false;
        state.progress = 0;
        state.duration = buffer?.duration ?? 0;
        pausedAt = 0;
    }
    function pause() {
        if (!audioContext || !state.isPlaying)
            return;
        pausedAt = audioContext.currentTime - startTime;
        state.isPlaying = false;
        cancelProgress();
        detachSource();
    }
    function resume() {
        if (!audioContext || !buffer || state.isPlaying)
            return;
        const offset = clamp(pausedAt, 0, buffer.duration);
        createSource();
        if (!sourceNode)
            return;
        startTime = audioContext.currentTime - offset;
        sourceNode.start(0, offset);
        state.isPlaying = true;
        cancelProgress();
        rafId = requestAnimationFrame(updateProgress);
    }
    function seek(position) {
        if (!buffer)
            return;
        const offset = clamp(position, 0, 1) * buffer.duration;
        pausedAt = offset;
        state.progress = buffer.duration > 0 ? clamp(offset / buffer.duration, 0, 1) : 0;
        if (state.isPlaying) {
            detachSource();
            createSource();
            if (!sourceNode || !audioContext)
                return;
            startTime = audioContext.currentTime - offset;
            sourceNode.start(0, offset);
        }
    }
    onBeforeUnmount(() => {
        stop();
    });
    return { state, loadAndPlay, stop, pause, resume, seek };
}
//# sourceMappingURL=useSamplePreview.client.js.map