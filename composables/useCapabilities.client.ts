import { ref } from 'vue'

export interface Capabilities {
  supportsWebMIDI: boolean
  supportsAudioInput: boolean
}

export function useCapabilities() {
  const capabilities = ref<Capabilities>({ supportsWebMIDI: false, supportsAudioInput: false })

  const evaluate = () => {
    capabilities.value = {
      supportsWebMIDI: typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator,
      supportsAudioInput: typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia)
    }
  }

  evaluate()

  return {
    capabilities,
    evaluate
  }
}
