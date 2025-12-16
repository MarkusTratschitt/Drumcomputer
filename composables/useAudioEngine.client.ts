import { onBeforeUnmount, ref } from 'vue'
import type { DrumPadId } from '~/types/drums'
import type { FxSettings, SampleRef, Soundbank } from '~/types/audio'

interface TriggerRequest {
  padId: DrumPadId
  when: number
  velocity?: number
}

export function useAudioEngine() {
  const audioContext = ref<AudioContext | null>(null)
  const masterGain = ref<GainNode | null>(null)
  const sampleCache = ref<Map<DrumPadId, AudioBuffer>>(new Map())
  const fxSettings = ref<FxSettings>({
    filter: { enabled: true, frequency: 12000, q: 0.7 },
    drive: { enabled: false, amount: 0.25 },
    reverb: { enabled: false, mix: 0.15 }
  })
  const fxInput = ref<GainNode | null>(null)
  const driveNode = ref<WaveShaperNode | null>(null)
  const filterNode = ref<BiquadFilterNode | null>(null)
  const dryGain = ref<GainNode | null>(null)
  const wetGain = ref<GainNode | null>(null)
  const reverbNode = ref<ConvolverNode | null>(null)
  const fxConnected = ref(false)

  const createDriveCurve = (amount: number) => {
    const k = Math.max(0, amount) * 50 + 1
    const samples = 1024
    const curve = new Float32Array(samples)
    for (let i = 0; i < samples; i += 1) {
      const x = (i * 2) / samples - 1
      curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x))
    }
    return curve
  }

  const createImpulseResponse = (ctx: BaseAudioContext, duration = 1.2, decay = 2.5) => {
    const length = Math.max(1, Math.floor(ctx.sampleRate * duration))
    const impulse = ctx.createBuffer(2, length, ctx.sampleRate)
    for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
      const channelData = impulse.getChannelData(channel)
      for (let i = 0; i < length; i += 1) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay)
      }
    }
    return impulse
  }

  const updateFxNodes = (ctx: AudioContext) => {
    if (filterNode.value) {
      filterNode.value.frequency.value = fxSettings.value.filter.enabled
        ? fxSettings.value.filter.frequency
        : ctx.sampleRate / 2
      filterNode.value.Q.value = fxSettings.value.filter.q
    }
    if (driveNode.value) {
      const amount = fxSettings.value.drive.enabled ? fxSettings.value.drive.amount : 0
      driveNode.value.curve = createDriveCurve(amount)
    }
    if (dryGain.value && wetGain.value) {
      const mix = fxSettings.value.reverb.enabled ? fxSettings.value.reverb.mix : 0
      dryGain.value.gain.value = Math.max(0, 1 - mix)
      wetGain.value.gain.value = Math.max(0, Math.min(1, mix))
    }
    if (reverbNode.value && !reverbNode.value.buffer) {
      reverbNode.value.buffer = createImpulseResponse(ctx)
    }
  }

  const ensureFxGraph = (ctx: AudioContext) => {
    if (!fxInput.value) {
      fxInput.value = ctx.createGain()
    }
    if (!driveNode.value) {
      driveNode.value = ctx.createWaveShaper()
    }
    if (!filterNode.value) {
      filterNode.value = ctx.createBiquadFilter()
      filterNode.value.type = 'lowpass'
    }
    if (!dryGain.value) {
      dryGain.value = ctx.createGain()
    }
    if (!wetGain.value) {
      wetGain.value = ctx.createGain()
    }
    if (!reverbNode.value) {
      reverbNode.value = ctx.createConvolver()
      reverbNode.value.buffer = createImpulseResponse(ctx)
    }
    if (!fxConnected.value) {
      fxInput.value?.connect(driveNode.value as WaveShaperNode)
      driveNode.value?.connect(filterNode.value as BiquadFilterNode)
      filterNode.value?.connect(dryGain.value as GainNode)
      filterNode.value?.connect(reverbNode.value as ConvolverNode)
      reverbNode.value?.connect(wetGain.value as GainNode)
      dryGain.value?.connect(masterGain.value as GainNode)
      wetGain.value?.connect(masterGain.value as GainNode)
      fxConnected.value = true
    }
    updateFxNodes(ctx)
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
    ensureFxGraph(audioContext.value as AudioContext)
    return audioContext.value as AudioContext
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
    const ctx = ensureContext()
    updateFxNodes(ctx)
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
    if (fxInput.value) {
      gain.connect(fxInput.value)
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
    trigger
  }
}
