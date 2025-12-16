import { onBeforeUnmount, ref } from 'vue'
import type { DrumPadId } from '~/types/drums'
import type { SampleRef, Soundbank } from '~/types/audio'

interface TriggerRequest {
  padId: DrumPadId
  when: number
  velocity: number
}

export function useAudioEngine() {
  const audioContext = ref<AudioContext | null>(null)
  const masterGain = ref<GainNode | null>(null)
  const sampleCache = ref<Map<string, AudioBuffer>>(new Map())

  const ensureContext = () => {
    if (!audioContext.value) {
      const context = new AudioContext()
      const gain = context.createGain()
      gain.gain.value = 0.8
      gain.connect(context.destination)
      audioContext.value = context
      masterGain.value = gain
    }
    return audioContext.value as AudioContext
  }

  const loadSample = async (sample: SampleRef): Promise<AudioBuffer | null> => {
    const ctx = ensureContext()
    if (sampleCache.value.has(sample.id)) {
      return sampleCache.value.get(sample.id) ?? null
    }
    if (!sample.url) {
      return null
    }
    const response = await fetch(sample.url)
    const arrayBuffer = await response.arrayBuffer()
    const buffer = await ctx.decodeAudioData(arrayBuffer)
    sampleCache.value.set(sample.id, buffer)
    return buffer
  }

  const applySoundbank = async (bank: Soundbank) => {
    await Promise.all(
      Object.values(bank.pads).map(async (sample) => {
        if (sample) {
          await loadSample(sample)
        }
      })
    )
  }

  const trigger = async ({ padId, when, velocity }: TriggerRequest) => {
    const ctx = ensureContext()
    const buffer = sampleCache.value.get(padId) ?? null
    if (!buffer) {
      return
    }
    const source = ctx.createBufferSource()
    source.buffer = buffer
    const gain = ctx.createGain()
    gain.gain.value = velocity
    source.connect(gain)
    gain.connect(masterGain.value ?? ctx.destination)
    source.start(when)
  }

  const setSoundForPad = (padId: DrumPadId, sample: SampleRef) => {
    if (sample.buffer) {
      sampleCache.value.set(padId, sample.buffer)
    }
  }

  onBeforeUnmount(() => {
    audioContext.value?.close()
    sampleCache.value.clear()
  })

  return {
    audioContext,
    masterGain,
    sampleCache,
    ensureContext,
    loadSample,
    applySoundbank,
    trigger,
    setSoundForPad
  }
}
