import { onBeforeUnmount, ref } from 'vue'

export interface AudioInputState {
  stream?: MediaStream
  error?: string
}

export function useAudioInput() {
  const state = ref<AudioInputState>({})
  const sourceNode = ref<MediaStreamAudioSourceNode | null>(null)
  const audioContext = ref<AudioContext | null>(null)
  let handlePageHide: (() => void) | null = null

  const requestMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const context = new AudioContext()
      sourceNode.value = context.createMediaStreamSource(stream)
      audioContext.value = context
      state.value = { stream }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'microphone request failed'
      state.value = { error: message }
    }
  }

  const stop = () => {
    state.value.stream?.getTracks().forEach((track) => track.stop())
    void audioContext.value?.close()
    audioContext.value = null
    state.value = {}
  }

  if (typeof window !== 'undefined') {
    handlePageHide = () => {
      stop()
      sourceNode.value = null
    }
    window.addEventListener('pagehide', handlePageHide)
  }

  onBeforeUnmount(() => {
    if (handlePageHide) {
      window.removeEventListener('pagehide', handlePageHide)
    }
    stop()
    sourceNode.value = null
  })

  return {
    state,
    sourceNode,
    requestMic,
    stop
  }
}
