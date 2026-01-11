import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import PatternsPanel from '@/components/panels/PatternsPanel.vue'
import { clearShortcuts, registerShortcut } from '@/composables/useShortcuts'
import type { GridSpec } from '@/types/time'
import type { StepGrid } from '@/types/drums'

const gridSpec: GridSpec = { bars: 1, division: 16 }
const steps: StepGrid = {}

const baseProps = {
  patterns: [{ id: 'p1', name: 'Pattern 1', gridSpec, steps }],
  selectedPatternId: 'p1',
  scenes: [{ id: 's1', name: 'Scene 1', patternIds: ['p1'] }],
  activeSceneId: 's1'
}

describe('PatternsPanel.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    clearShortcuts()
  })

  it('renders title with shortcut for Add Scene', () => {
    registerShortcut('SCENE_NEW', {
      keys: 'Ctrl+Shift+N',
      handler: () => { },
      description: 'New Scene'
    })

    const wrapper = mount(PatternsPanel, {
      props: baseProps,
      global: {
        stubs: {
          'v-select': { template: '<div class="v-select-stub"></div>' },
          'v-text-field': { template: '<div class="v-text-field-stub"></div>' },
          'v-btn': { template: '<button class="v-btn" v-bind="$attrs"><slot /></button>' },
          'v-row': { template: '<div class="v-row"><slot /></div>' },
          'v-col': { template: '<div class="v-col"><slot /></div>' },
          'v-combobox': { template: '<div class="v-combobox-stub"></div>' },
          'client-only': { template: '<div><slot /></div>' }
        }
      }
    })
    const addSceneBtn = wrapper.findAll('button.v-btn').find((btn) => btn.text().includes('Add Scene'))
    expect(addSceneBtn).toBeDefined()
    expect(addSceneBtn?.attributes('title')).toContain('(Ctrl+Shift+N)')
  })
})
