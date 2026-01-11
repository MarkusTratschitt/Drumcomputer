import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import TransportBar from '@/components/TransportBar.vue'
import { clearShortcuts, registerShortcut } from '@/composables/useShortcuts'

describe('TransportBar.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    clearShortcuts()
  })

  it('renders Play button with shortcut tooltip', () => {
    registerShortcut('TRANSPORT_PLAY', {
      keys: 'Space',
      handler: () => { },
      description: 'Play'
    })

    const wrapper = mount(TransportBar, {
      props: {
        bpm: 120,
        isPlaying: false,
        loop: false,
        division: 16,
        divisions: [4, 8, 16, 32]
      },
      global: {
        stubs: {
          'client-only': { template: '<div><slot /></div>' }
        }
      }
    })

    const buttons = wrapper.findAll('button.control-btn')
    const playBtn = buttons.find((btn) => {
      const mainSpan = btn.find('span.control-btn__main')
      return mainSpan.exists() && mainSpan.text() === 'PLAY'
    })
    expect(playBtn).toBeDefined()
    expect(playBtn?.attributes('title')).toContain('Space')
  })
})
