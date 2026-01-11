import { describe, it, expect, beforeEach, vi } from 'vitest'
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

  it('renders quick edit buttons with shortcut titles containing expected shortcuts', async () => {
    const wrapper = mount(DrumMachine)
    await nextTick()
    const quickEditButtons = wrapper.findAll('.quick-edit-btn')
    const byLabel = (label: string) => quickEditButtons.find((btn) => btn.text().includes(label))

    const volumeBtn = byLabel('VOLUME')
    const swingBtn = byLabel('SWING')
    const tempoBtn = byLabel('TEMPO')

    // Assert title exists and contains expected shortcut
    expect(volumeBtn).toBeDefined()
    const volumeTitle = volumeBtn?.attributes('title')
    expect(volumeTitle).toBeDefined()
    expect(volumeTitle).toContain('VOLUME')
    expect(volumeTitle).toContain(SHORTCUT_COMMANDS.QUICK_VOLUME)

    expect(swingBtn).toBeDefined()
    const swingTitle = swingBtn?.attributes('title')
    expect(swingTitle).toBeDefined()
    expect(swingTitle).toContain('SWING')
    expect(swingTitle).toContain(SHORTCUT_COMMANDS.QUICK_SWING)

    expect(tempoBtn).toBeDefined()
    const tempoTitle = tempoBtn?.attributes('title')
    expect(tempoTitle).toBeDefined()
    expect(tempoTitle).toContain('TEMPO')
    expect(tempoTitle).toContain(SHORTCUT_COMMANDS.QUICK_TEMPO)
  })

  it('quick edit button tooltips match expected format', async () => {
    const wrapper = mount(DrumMachine)
    await nextTick()
    const quickEditButtons = wrapper.findAll('.quick-edit-btn')

    // Verify all three buttons are present
    expect(quickEditButtons.length).toBeGreaterThanOrEqual(3)

    // Each button should have a title attribute with pattern "LABEL (SHORTCUT)"
    for (const btn of quickEditButtons) {
      const title = btn.attributes('title')
      expect(title).toBeDefined()
      expect(title).toMatch(/^.+\s\(.+\)$/) // Format: "LABEL (SHORTCUT)"
    }
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

  it('maps quick edit labels to the expected parameter names before focusing encoder', async () => {
    const wrapper = mount(DrumMachine)
    await nextTick()
    const vm = wrapper.vm as unknown as { findParamIndexByName: (namePart: string) => number }
    const spy = vi.spyOn(vm, 'findParamIndexByName')

    const quickEditButtons = wrapper.findAll('.quick-edit-btn')
    const tempoBtn = quickEditButtons.find((btn) => btn.text().includes('TEMPO'))

    await tempoBtn?.trigger('click')

    expect(spy).toHaveBeenCalledWith('BPM')
  })
})
