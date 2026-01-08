import { defineStore } from 'pinia';
export const useSessionStore = defineStore('session', {
    state: () => ({
        midiInput: undefined,
        midiOutput: undefined,
        audioReady: false,
        capabilities: {
            supportsWebMIDI: false,
            supportsAudioInput: false
        }
    }),
    actions: {
        setMidiInput(device) {
            this.midiInput = device;
        },
        setMidiOutput(device) {
            this.midiOutput = device;
        },
        setAudioReady(isReady) {
            this.audioReady = isReady;
        },
        setCapabilities(capabilities) {
            this.capabilities = capabilities;
        }
    }
});
//# sourceMappingURL=session.js.map