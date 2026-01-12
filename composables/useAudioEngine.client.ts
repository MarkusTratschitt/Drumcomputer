import { onBeforeUnmount, ref } from 'vue'
import type { DrumPadId } from '@/types/drums'
import type { FxSettings, SampleRef, Soundbank } from '@/types/audio'
import { createSeededRandom, type RandomSource } from '@/utils/seededRandom'
import { createFxGraph, connectFxGraph, updateFxGraph, type FxGraphNodes } from '@/audio/fxGraph'

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
  const decodeErrors = ref<Map<string, Error>>(new Map())
  const fxSettings = ref<FxSettings>({
    filter: { enabled: true, frequency: 12000, q: 0.7 },
    drive: { enabled: false, amount: 0.25 },
    reverb: { enabled: false, mix: 0.15 }
  })
  const fxSnapshot = ref<FxSettings>(cloneFxSettings(fxSettings.value))
  const fxGraph = ref<FxGraphNodes | null>(null)
  let randomSource: RandomSource = createSeededRandom(0)
  let wasRunningOnHide = false
  let handlePageHide: (() => void) | null = null
  let handlePageShow: (() => void) | null = null

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
    ensureFxGraph(audioContext.value as BaseAudioContext, fxSnapshot.value)
    return audioContext.value as AudioContext
  }

  const resumeContext = async () => {
    const ctx = ensureContext()
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }
    return ctx
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
      try {
        // Validate blob before attempting to decode
        if (!sample.blob.size || sample.blob.size === 0) {
          throw new Error(`Blob for sample ${sample.id} is empty`)
        }

        const arrayBuffer = await sample.blob.arrayBuffer()
        if (!arrayBuffer || arrayBuffer.byteLength === 0) {
          throw new Error(`Blob for sample ${sample.id} produced empty ArrayBuffer`)
        }

        return await new Promise<AudioBuffer>((resolve, reject) => {
          ctx.decodeAudioData(arrayBuffer.slice(0), resolve, reject)
        })
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        const fullMsg = `Failed to decode audio blob for sample ${sample.id}: ${errorMsg}`
        console.error(fullMsg, error)
        decodeErrors.value.set(sample.id, error instanceof Error ? error : new Error(errorMsg))
        return null
      }
    }

    if (sample.url) {
      try {
        const response = await fetch(sample.url)
        if (!response.ok) {
          throw new Error(`Failed to fetch audio from URL ${sample.url}: ${response.statusText}`)
        }
        const arrayBuffer = await response.arrayBuffer()
        if (!arrayBuffer || arrayBuffer.byteLength === 0) {
          throw new Error(`Audio URL ${sample.url} returned empty data`)
        }
        return await new Promise<AudioBuffer>((resolve, reject) => {
          ctx.decodeAudioData(arrayBuffer, resolve, reject)
        })
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        const fullMsg = `Failed to decode audio from URL ${sample.url}: ${errorMsg}`
        console.error(fullMsg, error)
        decodeErrors.value.set(sample.id, error instanceof Error ? error : new Error(errorMsg))
        return null
      }
    }
    return null
  }

  const setSampleForPad = async (padId: DrumPadId, sample: SampleRef) => {
    const buffer = sample.buffer ?? (await decodeSample(sample))
    if (buffer) {
      sampleCache.value.set(padId, buffer)
    }
    // Return boolean to indicate success/failure
    return buffer !== null && buffer !== undefined
  }

  const applySoundbank = async (bank: Soundbank) => {
    const entries = Object.entries(bank.pads)
    const results = await Promise.all(
      entries.map(async ([padId, sample]) => {
        if (sample) {
          const success = await setSampleForPad(padId as DrumPadId, sample)
          return { padId, success }
        }
        return { padId, success: false }
      })
    )

    const failedPads = results.filter(r => !r.success).map(r => r.padId)
    if (failedPads.length > 0) {
      const msg = `Failed to load samples for pads: ${failedPads.join(', ')}`
      console.warn(msg)
    }

    // Return results instead of silently failing
    return { successCount: results.filter(r => r.success).length, failedPads }
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

  const triggerClick = async (when: number, accented = false, volume = 0.12) => {
    const ctx = ensureContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.value = accented ? 2200 : 1600
    const base = Math.max(0, Math.min(1, volume))
    gain.gain.setValueAtTime((accented ? 1.4 : 1) * base, when)
    gain.gain.exponentialRampToValueAtTime(0.0001, when + 0.06)
    osc.connect(gain)
    gain.connect(masterGain.value ?? ctx.destination)
    osc.start(when)
    osc.stop(when + 0.08)
  }

  if (typeof window !== 'undefined') {
    handlePageHide = () => {
      if (audioContext.value) {
        wasRunningOnHide = audioContext.value.state === 'running'
        void audioContext.value.suspend().catch(() => undefined)
      }
    }

    handlePageShow = () => {
      if (wasRunningOnHide && audioContext.value) {
        void audioContext.value.resume().catch(() => undefined)
      }
      wasRunningOnHide = false
    }

    window.addEventListener('pagehide', handlePageHide)
    window.addEventListener('pageshow', handlePageShow)
  }

  onBeforeUnmount(() => {
    if (handlePageHide) {
      window.removeEventListener('pagehide', handlePageHide)
    }
    if (handlePageShow) {
      window.removeEventListener('pageshow', handlePageShow)
    }
    audioContext.value?.close()
    sampleCache.value.clear()
  })

  return {
    audioContext,
    masterGain,
    sampleCache,
    decodeErrors,
    fxSettings,
    ensureContext,
    resumeContext,
    decodeSample,
    applySoundbank,
    setFx,
    setSampleForPad,
    trigger,
    triggerClick,
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
