import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick } from 'vue'
import DrumMachine from '@/components/DrumMachine.vue'
import { SHORTCUT_COMMANDS } from '@/composables/shortcutCommands'

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

    expect(playBtn?.attributes('title')).toBe(`PLAY (${SHORTCUT_COMMANDS.TRANSPORT_PLAY})`)
    expect(stopBtn?.attributes('title')).toBe(`STOP (${SHORTCUT_COMMANDS.TRANSPORT_STOP})`)
  })

  it('transport button tooltips contain expected shortcuts in DOM attributes', async () => {
    const wrapper = mount(DrumMachine)
    await nextTick()

    const buttons = wrapper.findAll('.transport-grid .control-btn')
    const playBtn = buttons.find((btn) => btn.text().includes('PLAY'))
    const stopBtn = buttons.find((btn) => btn.text().includes('STOP'))
    const restartBtn = buttons.find((btn) => btn.text().includes('RESTART'))
    const followBtn = buttons.find((btn) => btn.text().includes('FOLLOW'))

    // PLAY button - verify title contains 'Space'
    expect(playBtn).toBeDefined()
    const playTitle = playBtn?.attributes('title')
    expect(playTitle).toBeDefined()
    expect(playTitle).toContain('PLAY')
    expect(playTitle).toContain(SHORTCUT_COMMANDS.TRANSPORT_PLAY)

    // STOP button - verify title contains 'Shift+Space'
    expect(stopBtn).toBeDefined()
    const stopTitle = stopBtn?.attributes('title')
    expect(stopTitle).toBeDefined()
    expect(stopTitle).toContain('STOP')
    expect(stopTitle).toContain(SHORTCUT_COMMANDS.TRANSPORT_STOP)

    // RESTART button - verify title contains 'L'
    if (restartBtn) {
      const restartTitle = restartBtn.attributes('title')
      expect(restartTitle).toBeDefined()
      expect(restartTitle).toContain('RESTART')
      expect(restartTitle).toContain(SHORTCUT_COMMANDS.TRANSPORT_LOOP)
    }

    // FOLLOW button - verify title contains 'F'
    if (followBtn) {
      const followTitle = followBtn.attributes('title')
      expect(followTitle).toBeDefined()
      expect(followTitle).toContain('FOLLOW')
      expect(followTitle).toContain(SHORTCUT_COMMANDS.TRANSPORT_FOLLOW)
    }
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

  it('invokes restartLoop and tapTempo when RESTART and TAP are clicked', async () => {
    const wrapper = mount(DrumMachine)
    await nextTick()

    const vm = wrapper.vm as unknown as { restartLoop: () => void; tapTempo: () => void }
    const restartSpy = vi.spyOn(vm, 'restartLoop')
    const tapSpy = vi.spyOn(vm, 'tapTempo')

    const buttons = wrapper.findAll('.transport-grid .control-btn')
    const restartBtn = buttons.find((btn) => btn.text().includes('RESTART'))
    const tapBtn = buttons.find((btn) => btn.text().includes('TAP'))

    await restartBtn?.trigger('click')
    await tapBtn?.trigger('click')

    expect(restartSpy).toHaveBeenCalledTimes(1)
    expect(tapSpy).toHaveBeenCalledTimes(1)
  })
})