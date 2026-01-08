import { ref } from 'vue';
export function useCapabilities() {
    const capabilities = ref({ supportsWebMIDI: false, supportsAudioInput: false });
    const evaluate = () => {
        capabilities.value = {
            supportsWebMIDI: typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator,
            supportsAudioInput: typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia)
        };
    };
    evaluate();
    return {
        capabilities,
        evaluate
    };
}
//# sourceMappingURL=useCapabilities.client.js.map