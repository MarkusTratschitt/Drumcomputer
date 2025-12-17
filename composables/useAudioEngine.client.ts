import { onBeforeUnmount, ref } from 'vue'
import type { DrumPadId } from '~/types/drums'
import type { FxSettings, SampleRef, Soundbank } from '~/types/audio'
import { createSeededRandom, type RandomSource } from '~/utils/seededRandom'
import { createFxGraph, connectFxGraph, updateFxGraph, type FxGraphNodes } from '~/domain/audio/fxGraph'

interface TriggerRequest {
  padId: DrumPadId
  when: number
  velocity?: number
}

const cloneFxSettings = (settings: FxSettings): FxSettings => ({
  filter: { ...settings.filter },
  drive: { ...settings.drive },
  reverb: { ...settings.reverb }
})

const createAudioEngineInstance = () => {
  const audioContext = ref<AudioContext | null>(null)
  const masterGain = ref<GainNode | null>(null)
  const sampleCache = ref<Map<DrumPadId, AudioBuffer>>(new Map())
  const fxSettings = ref<FxSettings>({
    filter: { enabled: true, frequency: 12000, q: 0.7 },
    drive: { enabled: false, amount: 0.25 },
    reverb: { enabled: false, mix: 0.15 }
  })
  const fxSnapshot = ref<FxSettings>(cloneFxSettings(fxSettings.value))
  const fxGraph = ref<FxGraphNodes | null>(null)
  let randomSource: RandomSource = createSeededRandom(0)

  const syncFxSnapshot = () => {
    fxSnapshot.value = cloneFxSettings(fxSettings.value)
    return fxSnapshot.value
  }

  const ensureFxGraph = (ctx: BaseAudioContext, snapshot: FxSettings) => {
    if (!masterGain.value) {
      return
    }
    if (!fxGraph.value) {
      fxGraph.value = createFxGraph(ctx)
      connectFxGraph(fxGraph.value, masterGain.value)
    }
    updateFxGraph(ctx, fxGraph.value, snapshot, randomSource)
  }

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
    ensureFxGraph(audioContext.value as BaseAudioContext, fxSnapshot.value)
    return audioContext.value as AudioContext
  }

  const getFxSnapshot = () => cloneFxSettings(fxSnapshot.value)

  const setFxRandomSource = (source: RandomSource) => {
    randomSource = source
    if (fxGraph.value?.reverbNode) {
      fxGraph.value.reverbNode.buffer = null
    }
    if (audioContext.value) {
      ensureFxGraph(audioContext.value, fxSnapshot.value)
    }
  }

  const decodeSample = async (sample: SampleRef): Promise<AudioBuffer | null> => {
    const ctx = ensureContext()
    if (sample.buffer) {
      return sample.buffer
    }
    if (sample.blob) {
      const arrayBuffer = await sample.blob.arrayBuffer()
      return ctx.decodeAudioData(arrayBuffer.slice(0))
    }
    if (sample.url) {
      const response = await fetch(sample.url)
      const arrayBuffer = await response.arrayBuffer()
      return ctx.decodeAudioData(arrayBuffer)
    }
    return null
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

  const setFx = (partial: Partial<FxSettings>) => {
    fxSettings.value = {
      filter: { ...fxSettings.value.filter, ...(partial.filter ?? {}) },
      drive: { ...fxSettings.value.drive, ...(partial.drive ?? {}) },
      reverb: { ...fxSettings.value.reverb, ...(partial.reverb ?? {}) }
    }
    const snapshot = syncFxSnapshot()
    const ctx = ensureContext()
    ensureFxGraph(ctx, snapshot)
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
    if (fxGraph.value) {
      gain.connect(fxGraph.value.fxInput)
    } else {
      gain.connect(masterGain.value ?? ctx.destination)
    }
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
    fxSettings,
    ensureContext,
    decodeSample,
    applySoundbank,
    setFx,
    setSampleForPad,
    trigger,
    getFxSnapshot,
    setFxRandomSource
  }
}

let audioEngineInstance: ReturnType<typeof createAudioEngineInstance> | null = null

export function useAudioEngine() {
  if (!audioEngineInstance) {
    audioEngineInstance = createAudioEngineInstance()
  }
  return audioEngineInstance
}
