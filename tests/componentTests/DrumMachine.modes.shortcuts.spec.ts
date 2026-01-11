import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick } from 'vue'
import DrumMachine from '../../components/DrumMachine.vue'

describe('DrumMachine mode button tooltips', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    global.AudioContext = class { } as typeof AudioContext
  })

  it('shows shortcut keys for MODE_* buttons', async () => {
    const wrapper = mount(DrumMachine)
    await nextTick()
    const buttons = wrapper.findAll('.control-fixed .control-btn')
    const channelBtn = buttons.find((b) => b.text().includes('CHANNEL'))
    const pluginBtn = buttons.find((b) => b.text().includes('PLUG-IN'))
    const arrangerBtn = buttons.find((b) => b.text().includes('ARRANGER'))
    const mixerBtn = buttons.find((b) => b.text().includes('MIXER'))
    const browserBtn = buttons.find((b) => b.text().includes('BROWSER'))
    const samplingBtn = buttons.find((b) => b.text().includes('SAMPLING'))

    expect(channelBtn?.attributes('title')).toContain('(Ctrl+1)')
    expect(pluginBtn?.attributes('title')).toContain('(Ctrl+2)')
    expect(arrangerBtn?.attributes('title')).toContain('(Ctrl+3)')
    expect(mixerBtn?.attributes('title')).toContain('(Ctrl+4)')
    expect(browserBtn?.attributes('title')).toContain('(Ctrl+B)')
    expect(samplingBtn?.attributes('title')).toContain('(Ctrl+5)')
  })
})
