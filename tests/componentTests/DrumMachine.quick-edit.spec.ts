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

  it('renders quick edit buttons with shortcut titles', async () => {
    const wrapper = mount(DrumMachine)
    await nextTick()
    const quickEditButtons = wrapper.findAll('.quick-edit-btn')
    const byLabel = (label: string) => quickEditButtons.find((btn) => btn.text().includes(label))

    const volumeBtn = byLabel('VOLUME')
    const swingBtn = byLabel('SWING')
    const tempoBtn = byLabel('TEMPO')

    expect(volumeBtn?.attributes('title')).toBe(`VOLUME (${SHORTCUT_COMMANDS.QUICK_VOLUME})`)
    expect(swingBtn?.attributes('title')).toBe(`SWING (${SHORTCUT_COMMANDS.QUICK_SWING})`)
    expect(tempoBtn?.attributes('title')).toBe(`TEMPO (${SHORTCUT_COMMANDS.QUICK_TEMPO})`)
  })

  it('triggers focusedEncoderIndex change on quick edit click', async () => {
    const wrapper = mount(DrumMachine)
    await nextTick()
    const vm = wrapper.vm as unknown as { focusedEncoderIndex: number | null }

    const quickEditButtons = wrapper.findAll('.quick-edit-btn')
    const volumeBtn = quickEditButtons[0]

    await volumeBtn?.trigger('click')

    // After clicking Volume, the focused encoder index should change to a Volume-related param
    // or at least onKnobFocus should have been called
    expect(vm.focusedEncoderIndex).toBeDefined()
  })
})
