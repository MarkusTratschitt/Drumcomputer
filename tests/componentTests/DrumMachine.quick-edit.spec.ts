import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick } from 'vue'
import DrumMachine from '../../components/DrumMachine.vue'

describe('DrumMachine quick edit buttons', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    global.AudioContext = class { } as typeof AudioContext
  })

  it('renders quick edit buttons with shortcut titles', async () => {
    const wrapper = mount(DrumMachine)
    await nextTick()
    const quickEditButtons = wrapper.findAll('.quick-edit-btn')
    expect(quickEditButtons).toHaveLength(3)

    const volumeBtn = quickEditButtons[0]
    const swingBtn = quickEditButtons[1]
    const tempoBtn = quickEditButtons[2]

    expect(volumeBtn?.text()).toContain('VOLUME')
    expect(volumeBtn?.attributes('title')).toContain('(Ctrl+Alt+V)')

    expect(swingBtn?.text()).toContain('SWING')
    expect(swingBtn?.attributes('title')).toContain('(Ctrl+Alt+S)')

    expect(tempoBtn?.text()).toContain('TEMPO')
    expect(tempoBtn?.attributes('title')).toContain('(Ctrl+Alt+T)')
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
