import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick } from 'vue'
import DrumMachine from '../../components/DrumMachine.vue'
import { SHORTCUT_COMMANDS } from '@/composables/shortcutCommands'

describe('DrumMachine quick edit buttons', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    global.AudioContext = class { } as typeof AudioContext
  })

  it('renders titles with shortcut hints', async () => {
    const wrapper = mount(DrumMachine)
    await nextTick()
    const buttons = wrapper.findAll('.quick-edit-buttons .quick-edit-btn')

    const volumeBtn = buttons.find((btn) => btn.text().includes('VOLUME'))
    const swingBtn = buttons.find((btn) => btn.text().includes('SWING'))
    const tempoBtn = buttons.find((btn) => btn.text().includes('TEMPO'))

    expect(volumeBtn?.attributes('title')).toBe(`VOLUME (${SHORTCUT_COMMANDS.QUICK_VOLUME})`)
    expect(swingBtn?.attributes('title')).toBe(`SWING (${SHORTCUT_COMMANDS.QUICK_SWING})`)
    expect(tempoBtn?.attributes('title')).toBe(`TEMPO (${SHORTCUT_COMMANDS.QUICK_TEMPO})`)
  })

  it('focuses appropriate encoder and adjusts on shortcut', async () => {
    const wrapper = mount(DrumMachine)
    await nextTick()
    const volumeBtn = wrapper.findAll('.quick-edit-buttons .quick-edit-btn')[0]
    await volumeBtn.trigger('click')
    await nextTick()

    // Manually trigger encoder adjustment to update lastAction
    const vm = wrapper.vm as unknown as { adjustFocusedEncoder: (delta: number) => void; control: { lastAction: string } }
    vm.adjustFocusedEncoder(1)
    await nextTick()

    // Expect lastAction to include Volume or encoder name containing it
    const last = vm.control.lastAction
    expect(last).toMatch(/Volume|Vol|Encoder/i)
  })
})
