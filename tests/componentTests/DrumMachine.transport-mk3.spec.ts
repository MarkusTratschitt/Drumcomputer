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

  it('exposes shortcut titles on transport buttons', async () => {
    const wrapper = mount(DrumMachine)
    await nextTick()

    const buttons = wrapper.findAll('.transport-grid .control-btn')
    const playBtn = buttons.find((btn) => btn.text().includes('PLAY'))
    const stopBtn = buttons.find((btn) => btn.text().includes('STOP'))

    expect(playBtn?.attributes('title')).toMatch(/\(/)
    expect(stopBtn?.attributes('title')).toMatch(/\(/)
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
})