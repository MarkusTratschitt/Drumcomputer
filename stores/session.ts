import { defineStore } from 'pinia'
import type { MidiDeviceInfo } from '@/types/midi'

export const useSessionStore = defineStore('session', {
  state: () => ({
    midiInput: undefined as MidiDeviceInfo | undefined,
    midiOutput: undefined as MidiDeviceInfo | undefined,
    audioReady: false,
    capabilities: {
      supportsWebMIDI: false,
      supportsAudioInput: false
    }
  }),
  actions: {
    setMidiInput(device?: MidiDeviceInfo) {
      this.midiInput = device
    },
    setMidiOutput(device?: MidiDeviceInfo) {
      this.midiOutput = device
    },
    setAudioReady(isReady: boolean) {
      this.audioReady = isReady
    },
    setCapabilities(capabilities: { supportsWebMIDI: boolean; supportsAudioInput: boolean }) {
      this.capabilities = capabilities
    }
  }
})
