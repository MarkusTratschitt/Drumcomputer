import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useAudioEngine } from '@/composables/useAudioEngine.client'
import type { SampleRef, Soundbank } from '@/types/audio'

// Mock AudioContext and related APIs
class MockAudioContext {
  state = 'running'
  currentTime = 0
  destination = { maxChannelCount: 2 }
  sampleRate = 44100

  createBufferSource = vi.fn(() => ({
    buffer: null,
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn()
  }))

  createGain = vi.fn(() => ({
    gain: { value: 1, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    connect: vi.fn()
  }))

  createOscillator = vi.fn(() => ({
    type: 'sine',
    frequency: { value: 440 },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn()
  }))

  createConvolver = vi.fn(() => ({
    buffer: null,
    connect: vi.fn()
  }))

  createBiquadFilter = vi.fn(() => ({
    type: 'lowpass',
    frequency: { value: 20000, setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
    Q: { value: 1, setValueAtTime: vi.fn() },
    connect: vi.fn()
  }))

  createWaveShaper = vi.fn(() => ({
    curve: null,
    oversample: '1x',
    connect: vi.fn()
  }))

  createDynamicsCompressor = vi.fn(() => ({
    threshold: { value: -24 },
    knee: { value: 30 },
    ratio: { value: 12 },
    attack: { value: 0.003 },
    release: { value: 0.25 },
    connect: vi.fn()
  }))

  decodeAudioData = vi.fn((_buffer: ArrayBuffer, _success: (data: AudioBuffer) => void, error: (err: Error) => void) => {
    // Simulate decode failure for most tests
    error(new Error('EncodingError: Unable to decode audio data'))
  })

  suspend = vi.fn(() => Promise.resolve())
  resume = vi.fn(() => Promise.resolve())
  close = vi.fn()
}

// Mock AudioBuffer
class MockAudioBuffer {
  length: number
  sampleRate: number
  numberOfChannels: number
  duration: number

  constructor({ length = 1024, sampleRate = 44100, numberOfChannels = 2 } = {}) {
    this.length = length
    this.sampleRate = sampleRate
    this.numberOfChannels = numberOfChannels
    this.duration = length / sampleRate
  }

  getChannelData = vi.fn(() => new Float32Array(this.length))
  copyFromChannel = vi.fn()
  copyToChannel = vi.fn()
}

describe('useAudioEngine - Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks()
      // Setup global mocks
      ; (global as unknown as Record<string, unknown>).AudioContext = MockAudioContext
      ; (global as unknown as Record<string, unknown>).AudioBuffer = MockAudioBuffer
  })

  afterEach(() => {
    delete (global as unknown as Record<string, unknown>).AudioContext
    delete (global as unknown as Record<string, unknown>).AudioBuffer
    // Clear the engine singleton to clean up errors between tests
    const engine = useAudioEngine()
    engine.decodeErrors.value.clear()
  })

  it('decodeSample: handles empty blob gracefully', async () => {
    const engine = useAudioEngine()

    const emptyBlob = new Blob([], { type: 'audio/wav' })
    const sample: SampleRef = {
      id: 'pad1',
      name: 'Empty Sample',
      blob: emptyBlob
    }

    // This should return null for empty blob and record error
    const result = await engine.decodeSample(sample)
    expect(result).toBeNull()
    expect(engine.decodeErrors.value.has('pad1')).toBe(true)
  })

  it('decodeSample: handles invalid audio format', async () => {
    const engine = useAudioEngine()

    // Create invalid audio data
    const invalidAudioData = new ArrayBuffer(10)
    const invalidBlob = new Blob([invalidAudioData], { type: 'audio/wav' })
    const sample: SampleRef = {
      id: 'pad2',
      name: 'Invalid Audio',
      blob: invalidBlob
    }

    const result = await engine.decodeSample(sample)
    expect(result).toBeNull()
    expect(engine.decodeErrors.value.has('pad2')).toBe(true)
  })

  it('decodeSample: handles URL fetch errors', async () => {
    const engine = useAudioEngine()

    const sample: SampleRef = {
      id: 'pad3',
      name: 'Remote Sample',
      url: 'https://invalid.example.com/notfound.wav'
    }

    // Mock fetch to reject
    global.fetch = vi.fn(() => Promise.reject(new Error('Network error')))

    const result = await engine.decodeSample(sample)
    expect(result).toBeNull()
    expect(engine.decodeErrors.value.has('pad3')).toBe(true)
  })

  it('setSampleForPad: returns false when buffer is null', async () => {
    const engine = useAudioEngine()

    const invalidBlob = new Blob([], { type: 'audio/wav' })
    const sample: SampleRef = {
      id: 'pad4',
      name: 'Bad Sample',
      blob: invalidBlob
    }

    const result = await engine.setSampleForPad('pad4', sample)
    expect(result).toBe(false)
  })

  it('applySoundbank: collects failed pad ids', async () => {
    const engine = useAudioEngine()

    const soundbank: Soundbank = {
      id: 'bank1',
      name: 'Test Bank',
      pads: {
        pad1: { id: 'pad1', name: 'Sample 1', blob: new Blob([], { type: 'audio/wav' }) },
        pad2: { id: 'pad2', name: 'Sample 2', blob: new Blob([], { type: 'audio/wav' }) }
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    const result = await engine.applySoundbank(soundbank)

    expect(result.failedPads).toContain('pad1')
    expect(result.failedPads).toContain('pad2')
    expect(result.successCount).toBe(0)
  })

  it('applySoundbank: handles mixed success and failure', async () => {
    const engine = useAudioEngine()

    const validBuffer = new MockAudioBuffer({ length: 1024, sampleRate: 44100 })

    const soundbank: Soundbank = {
      id: 'bank1',
      name: 'Test Bank',
      pads: {
        pad1: {
          id: 'pad1',
          name: 'Valid Sample',
          buffer: validBuffer as unknown as AudioBuffer
        },
        pad2: {
          id: 'pad2',
          name: 'Invalid Sample',
          blob: new Blob([], { type: 'audio/wav' })
        }
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    const result = await engine.applySoundbank(soundbank)

    expect(result.successCount).toBe(1)
    expect(result.failedPads).toContain('pad2')
  })

  it('decodeErrors: tracks multiple sample decode failures', async () => {
    const engine = useAudioEngine()

    const sample1: SampleRef = { id: 'pad1', name: 'Sample 1', blob: new Blob([], { type: 'audio/wav' }) }
    const sample2: SampleRef = { id: 'pad2', name: 'Sample 2', blob: new Blob([], { type: 'audio/wav' }) }

    await engine.decodeSample(sample1)
    await engine.decodeSample(sample2)

    expect(engine.decodeErrors.value.size).toBe(2)
    expect(engine.decodeErrors.value.has('pad1')).toBe(true)
    expect(engine.decodeErrors.value.has('pad2')).toBe(true)
  })

  it('decodeSample: validates ArrayBuffer is not empty after blob conversion', async () => {
    const engine = useAudioEngine()

    // Create a blob that appears valid but contains no actual audio data
    const emptyAudioBlob = new Blob([], { type: 'audio/wav' })
    const sample: SampleRef = {
      id: 'pad5',
      name: 'Empty Audio',
      blob: emptyAudioBlob
    }

    const result = await engine.decodeSample(sample)
    expect(result).toBeNull()
    expect(engine.decodeErrors.value.has('pad5')).toBe(true)
  })
})
