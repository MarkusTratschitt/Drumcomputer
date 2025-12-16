import { ref } from 'vue'

export interface AudioInputState {
  stream?: MediaStream
  error?: string
}

export function useAudioInput() {
  const state = ref<AudioInputState>({})
  const sourceNode = ref<MediaStreamAudioSourceNode | null>(null)

  const requestMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const context = new AudioContext()
      sourceNode.value = context.createMediaStreamSource(stream)
      state.value = { stream }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'microphone request failed'
      state.value = { error: message }
    }
  }

  const stop = () => {
    state.value.stream?.getTracks().forEach((track) => track.stop())
    state.value = {}
  }

  return {
    state,
    sourceNode,
    requestMic,
    stop
  }
}
