import type { FxSettings } from '~/types/audio'
import type { RandomSource } from '~/utils/seededRandom'

export interface FxGraphNodes {
  fxInput: GainNode
  driveNode: WaveShaperNode
  filterNode: BiquadFilterNode
  dryGain: GainNode
  wetGain: GainNode
  reverbNode: ConvolverNode
  connected: boolean
}

export const createFxGraph = (ctx: BaseAudioContext): FxGraphNodes => ({
  fxInput: ctx.createGain(),
  driveNode: ctx.createWaveShaper(),
  filterNode: (() => {
    const node = ctx.createBiquadFilter()
    node.type = 'lowpass'
    return node
  })(),
  dryGain: ctx.createGain(),
  wetGain: ctx.createGain(),
  reverbNode: ctx.createConvolver(),
  connected: false
})

export const connectFxGraph = (graph: FxGraphNodes, masterGain: GainNode) => {
  if (graph.connected) return
  graph.fxInput.connect(graph.driveNode)
  graph.driveNode.connect(graph.filterNode)
  graph.filterNode.connect(graph.dryGain)
  graph.filterNode.connect(graph.reverbNode)
  graph.reverbNode.connect(graph.wetGain)
  graph.dryGain.connect(masterGain)
  graph.wetGain.connect(masterGain)
  graph.connected = true
}

export const updateFxGraph = (ctx: BaseAudioContext, graph: FxGraphNodes, snapshot: FxSettings, rng: RandomSource) => {
  const now = ctx.currentTime
  const frequencyValue = snapshot.filter.enabled ? snapshot.filter.frequency : ctx.sampleRate / 2
  graph.filterNode.frequency.setValueAtTime(frequencyValue, now)
  graph.filterNode.Q.setValueAtTime(snapshot.filter.q, now)

  const amount = snapshot.drive.enabled ? snapshot.drive.amount : 0
  graph.driveNode.curve = createDriveCurve(amount)

  const mix = snapshot.reverb.enabled ? snapshot.reverb.mix : 0
  graph.dryGain.gain.setValueAtTime(Math.max(0, 1 - mix), now)
  graph.wetGain.gain.setValueAtTime(Math.max(0, Math.min(1, mix)), now)

  if (snapshot.reverb.enabled) {
    if (!graph.reverbNode.buffer) {
      graph.reverbNode.buffer = createImpulseResponse(ctx, rng)
    }
  } else if (graph.reverbNode.buffer) {
    graph.reverbNode.buffer = null
  }
}

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

const createImpulseResponse = (ctx: BaseAudioContext, rng: RandomSource, duration = 1.2, decay = 2.5) => {
  const length = Math.max(1, Math.floor(ctx.sampleRate * duration))
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate)
  for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
    const channelData = impulse.getChannelData(channel)
    for (let i = 0; i < length; i += 1) {
      channelData[i] = (rng() * 2 - 1) * Math.pow(1 - i / length, decay)
    }
  }
  return impulse
}
