import { describe, it, expect, beforeEach, vi } from 'vitest'

let injectedContext: AudioContext | null = null

vi.mock('vue', async () => {
  const actual = await vi.importActual<typeof import('vue')>('vue')
  return {
    ...actual,
    inject: () => injectedContext
  }
})

import { useSamplePreview } from '../../composables/useSamplePreview.client'

class MockAudioBufferSourceNode {
  buffer: AudioBuffer | null = null
  onended: (() => void) | null = null
  connect() {
    return
  }
  disconnect() {
    return
  }
  start() {
    return
  }
  stop() {
    this.onended?.()
  }
}

class MockAudioContext {
  currentTime = 0
  state: AudioContextState = 'running'
  createBufferSource() {
    return new MockAudioBufferSourceNode() as unknown as AudioBufferSourceNode
  }
  async decodeAudioData() {
    return { duration: 4 } as AudioBuffer
  }
  async resume() {
    this.state = 'running'
  }
  destination = {} as AudioDestinationNode
}

describe('useSamplePreview', () => {
  let rafCallback: FrameRequestCallback | null = null

  beforeEach(() => {
    injectedContext = new MockAudioContext() as unknown as AudioContext
    rafCallback = null
    globalThis.requestAnimationFrame = (cb) => {
      rafCallback = cb
      return 1
    }
    globalThis.cancelAnimationFrame = () => {
      rafCallback = null
    }
  })

  it('loads and plays a blob', async () => {
    const preview = useSamplePreview()
    const blob = new Blob(['test'], { type: 'audio/wav' })
    await preview.loadAndPlay('/audio/test.wav', blob)
    expect(preview.state.isPlaying).toBe(true)
    expect(preview.state.currentFile).toBe('/audio/test.wav')
    expect(preview.state.duration).toBe(4)
  })

  it('stops playback', async () => {
    const preview = useSamplePreview()
    const blob = new Blob(['test'], { type: 'audio/wav' })
    await preview.loadAndPlay('/audio/test.wav', blob)
    preview.stop()
    expect(preview.state.isPlaying).toBe(false)
    expect(preview.state.progress).toBe(0)
  })

  it('tracks progress while playing', async () => {
    const preview = useSamplePreview()
    const blob = new Blob(['test'], { type: 'audio/wav' })
    await preview.loadAndPlay('/audio/test.wav', blob)
    const ctx = injectedContext as unknown as MockAudioContext
    ctx.currentTime = 2
    rafCallback?.(0)
    expect(preview.state.progress).toBeGreaterThan(0)
  })
})
