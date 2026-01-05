import { onBeforeUnmount, ref } from 'vue'
import type { DrumPadId } from '~/types/drums'
import type { SampleRef, Soundbank } from '~/types/audio'

interface TriggerRequest {
  padId: DrumPadId
  when: number
  velocity?: number
}

export function useAudioEngine() {
  const audioContext = ref<AudioContext | null>(null)
  const masterGain = ref<GainNode | null>(null)
  const sampleCache = ref<Map<DrumPadId, AudioBuffer>>(new Map())

  const ensureContext = () => {
    if (!audioContext.value) {
      const context = new AudioContext()
      const gain = context.createGain()
      gain.gain.value = 0.8
      gain.connect(context.destination)
      audioContext.value = context
      masterGain.value = gain
    }
    if (audioContext.value.state === 'suspended') {
      void audioContext.value.resume()
    }
    return audioContext.value as AudioContext
  }

  const decodeSample = async (sample: SampleRef): Promise<AudioBuffer | null> => {
    const ctx = ensureContext()
    if (!sample.url) {
      return sample.buffer ?? null
    }
    const response = await fetch(sample.url)
    const arrayBuffer = await response.arrayBuffer()
    const buffer = await ctx.decodeAudioData(arrayBuffer)
    return buffer
  }

  const setSampleForPad = async (padId: DrumPadId, sample: SampleRef) => {
    const buffer = sample.buffer ?? (await decodeSample(sample))
    if (buffer) {
      sampleCache.value.set(padId, buffer)
    }
  }

  const applySoundbank = async (bank: Soundbank) => {
    const entries = Object.entries(bank.pads)
    await Promise.all(
      entries.map(async ([padId, sample]) => {
        if (sample) {
          await setSampleForPad(padId as DrumPadId, sample)
        }
      })
    )
  }

  const trigger = async ({ padId, when, velocity = 1 }: TriggerRequest) => {
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

  onBeforeUnmount(() => {
    audioContext.value?.close()
    sampleCache.value.clear()
  })

  return {
    audioContext,
    masterGain,
    sampleCache,
    ensureContext,
    decodeSample,
    applySoundbank,
    setSampleForPad,
    trigger
  }
}
