import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick } from 'vue'
import DrumMachine from '@/components/DrumMachine.vue'

describe('DrumMachine MK3 transport buttons', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    global.AudioContext = class { } as typeof AudioContext
  })

  it('exposes shortcut titles on transport buttons with registered keys', async () => {
    const wrapper = mount(DrumMachine)
    await nextTick()

    const buttons = wrapper.findAll('.transport-grid .control-btn')
    const playBtn = buttons.find((btn) => btn.text().includes('PLAY'))
    const stopBtn = buttons.find((btn) => btn.text().includes('STOP'))

    // Titles should include exact shortcut keys from registry
    expect(playBtn?.attributes('title')).toContain('(Space)')
    expect(stopBtn?.attributes('title')).toContain('(Shift+Space)')
  })

  it('invokes play handler when PLAY is clicked', async () => {
    const wrapper = mount(DrumMachine)
    await nextTick()

    const vm = wrapper.vm as unknown as { start: () => Promise<void> }
    const playSpy = vi.spyOn(vm, 'start').mockResolvedValue()

    const buttons = wrapper.findAll('.transport-grid .control-btn')
    const playBtn = buttons.find((btn) => btn.text().includes('PLAY'))
    await playBtn?.trigger('click')

    expect(playSpy).toHaveBeenCalledTimes(1)
  })

  it('invokes stop and follow handlers when respective buttons clicked', async () => {
    const wrapper = mount(DrumMachine)
    await nextTick()

    const vm = wrapper.vm as unknown as { stop: () => void; toggleFollow: () => void }
    const stopSpy = vi.spyOn(vm, 'stop')
    const followSpy = vi.spyOn(vm, 'toggleFollow')

    const buttons = wrapper.findAll('.transport-grid .control-btn')
    const stopBtn = buttons.find((btn) => btn.text().includes('STOP'))
    const followBtn = buttons.find((btn) => btn.text().includes('FOLLOW'))

    await stopBtn?.trigger('click')
    await followBtn?.trigger('click')

    expect(stopSpy).toHaveBeenCalledTimes(1)
    expect(followSpy).toHaveBeenCalledTimes(1)
  })
})