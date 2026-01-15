import { describe, it, expect, beforeEach, vi as _vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import DualDisplay from '@/components/control/DualDisplay.vue'
import { clearShortcuts, registerShortcut } from '@/composables/useShortcuts'

describe('DualDisplay.vue', () => {
  let pinia: ReturnType<typeof createPinia>

  beforeEach(() => {
    pinia = createPinia()
    setActivePinia(pinia)
    clearShortcuts()
  })

  const mountDualDisplay = (props: any) => {
    return mount(DualDisplay, {
      props,
      global: {
        plugins: [pinia]
      }
    })
  }

  it('renders left and right displays', () => {
    const wrapper = mountDualDisplay({
      leftModel: { view: 'BROWSER', title: 'Test Left' },
      rightModel: { view: 'FILE', title: 'Test Right' },
      modeTitle: 'Test Mode',
      pageLabel: 'Page 1'
    })
    expect(wrapper.find('.display.left').exists()).toBe(true)
    expect(wrapper.find('.display.right').exists()).toBe(true)
  })

  it('does not show file search input in FILE view', () => {
    const wrapper = mountDualDisplay({
      leftModel: { view: 'FILE', title: 'Files', items: [] },
      rightModel: { view: 'BROWSER', title: 'Browser', items: [] },
      modeTitle: 'File Mode',
      pageLabel: 'Page 1'
    })
    const searchInput = wrapper.find('.display.left input[type="text"]')
    expect(searchInput.exists()).toBe(false)
  })

  it('renders scrollable file list wrapper in FILE view', () => {
    const items = Array.from({ length: 50 }, (_, i) => ({
      title: `File ${i + 1}`,
      subtitle: `path/to/file${i + 1}`
    }))
    const wrapper = mountDualDisplay({
      leftModel: { view: 'FILE', title: 'Files', items },
      rightModel: { view: 'BROWSER', title: 'Browser', items: [] },
      modeTitle: 'File Mode',
      pageLabel: 'Page 1'
    })
    const fileListWrapper = wrapper.find('.display.left .file-list-wrapper')
    expect(fileListWrapper.exists()).toBe(true)
    expect(fileListWrapper.element).toBeInstanceOf(HTMLDivElement)
  })

  it('filters FILE view items by fileQuery', async () => {
    const items = [
      { title: 'kick.wav', subtitle: 'path/kick.wav' },
      { title: 'snare.wav', subtitle: 'path/snare.wav' },
      { title: 'hihat.wav', subtitle: 'path/hihat.wav' }
    ]
    const wrapper = mountDualDisplay({
      leftModel: { view: 'FILE', title: 'Files', items },
      rightModel: { view: 'BROWSER', title: 'Browser', items: [] },
      modeTitle: 'File Mode',
      pageLabel: 'Page 1'
    })
    await wrapper.setData({ fileQuery: 'kick' })
    const visibleItems = wrapper.findAll('.display.left .item-list li')
    expect(visibleItems).toHaveLength(1)
    expect(visibleItems[0].text()).toContain('kick.wav')
  })

  it('filters BROWSER view items by browserQuery', async () => {
    const items = [
      { title: 'Kick 808', subtitle: 'Bass drum' },
      { title: 'Snare Clap', subtitle: 'Snappy' },
      { title: 'Hi-Hat Closed', subtitle: 'Metallic' }
    ]
    const wrapper = mountDualDisplay({
      leftModel: { view: 'BROWSER', title: 'Browser', items },
      rightModel: { view: 'FILE', title: 'Files', items: [] },
      modeTitle: 'Browser Mode',
      pageLabel: 'Page 1'
    })
    await wrapper.setData({ browserQuery: 'snare' })
    const visibleItems = wrapper.findAll('.display.left .item-list li')
    expect(visibleItems).toHaveLength(1)
    expect(visibleItems[0].text()).toContain('Snare Clap')
  })

  it('shows all FILE items when fileQuery is empty', async () => {
    const items = Array.from({ length: 10 }, (_, i) => ({
      title: `File ${i + 1}`,
      subtitle: `path/file${i + 1}`
    }))
    const wrapper = mountDualDisplay({
      leftModel: { view: 'FILE', title: 'Files', items },
      rightModel: { view: 'BROWSER', title: 'Browser', items: [] },
      modeTitle: 'File Mode',
      pageLabel: 'Page 1'
    })
    const visibleItems = wrapper.findAll('.display.left .item-list li')
    expect(visibleItems).toHaveLength(10)
  })

  it('renders FILE view in right panel with scroll wrapper', () => {
    const items = Array.from({ length: 20 }, (_, i) => ({
      title: `Dir ${i + 1}`,
      subtitle: `path/dir${i + 1}`
    }))
    const wrapper = mountDualDisplay({
      leftModel: { view: 'BROWSER', title: 'Browser', items: [] },
      rightModel: { view: 'FILE', title: 'Files', items },
      modeTitle: 'File Mode',
      pageLabel: 'Page 1'
    })
    const fileListWrapper = wrapper.find('.display.right .file-list-wrapper')
    expect(fileListWrapper.exists()).toBe(true)
    const visibleItems = wrapper.findAll('.display.right .item-list li')
    expect(visibleItems).toHaveLength(20)
  })

  it('wraps browser items in scroll container', () => {
    const items = Array.from({ length: 30 }, (_, i) => ({ title: `Item ${i}`, subtitle: `Path ${i}` }))
    const wrapper = mountDualDisplay({
      leftModel: { view: 'BROWSER', title: 'Browser', items },
      rightModel: { view: 'FILE', title: 'Files', items: [] },
      modeTitle: 'Browser',
      pageLabel: 'Page 1'
    })

    const browserList = wrapper.find('.display.left .browser-list')
    expect(browserList.exists()).toBe(true)
    expect(browserList.element).toBeInstanceOf(HTMLDivElement)
  })

  it('renders display title with mode and page', () => {
    const wrapper = mountDualDisplay({
      leftModel: { view: 'BROWSER', title: 'Browser', items: [] },
      rightModel: { view: 'FILE', title: 'Files', items: [] },
      modeTitle: 'Browser',
      pageLabel: 'Page 1'
    })
    const root = wrapper.find('.dual-display-root')
    expect(root.attributes('title')).toBe('Browser • Page 1')
  })

  it('renders load-to-pad control with shortcut and emits event', async () => {
    registerShortcut('BROWSER_LOAD_SELECTED_TO_PAD', {
      keys: 'Ctrl+Enter',
      handler: () => { },
      description: 'Load to pad'
    })

    const wrapper = mountDualDisplay({
      leftModel: { view: 'BROWSER', title: 'Browser', items: [] },
      rightModel: { view: 'FILE', title: 'Files', items: [] },
      modeTitle: 'Browser',
      pageLabel: 'Page 1'
    })
    const loadBtn = wrapper.find('button.browser-load-to-pad')
    expect(loadBtn.exists()).toBe(true)
    expect(loadBtn.attributes('title')).toContain('(Ctrl+Enter)')
    await loadBtn.trigger('click')
    expect(wrapper.emitted()['load-to-pad']).toBeTruthy()
  })

  it('applies active class to selected FILE items', () => {
    const items = [
      { title: 'File 1', subtitle: 'path/file1', active: false },
      { title: 'File 2', subtitle: 'path/file2', active: true },
      { title: 'File 3', subtitle: 'path/file3', active: false }
    ]
    const wrapper = mountDualDisplay({
      leftModel: { view: 'BROWSER', title: 'Browser', items: [] },
      rightModel: { view: 'FILE', title: 'Files', items },
      modeTitle: 'File Mode',
      pageLabel: 'Page 1'
    })
    const listItems = wrapper.findAll('.display.right .item-list li')
    expect(listItems[0].classes()).not.toContain('active')
    expect(listItems[1].classes()).toContain('active')
    expect(listItems[2].classes()).not.toContain('active')
  })

  it('formats param values correctly', () => {
    const wrapper = mountDualDisplay({
      leftModel: { view: 'BROWSER', title: 'Browser', items: [] },
      rightModel: { view: 'FILE', title: 'Files', items: [] },
      modeTitle: 'Test',
      pageLabel: 'Page 1',
      paramSlotsLeft: [
        { id: 'p1', name: 'Volume', value: 75.456, format: 'dB' },
        { id: 'p2', name: 'Pan', value: 0.333 }
      ]
    })
    const paramValues = wrapper.findAll('.display.left .param-value')
    expect(paramValues[0].text()).toBe('75.456dB')
    expect(paramValues[1].text()).toBe('0.33')
  })
})
