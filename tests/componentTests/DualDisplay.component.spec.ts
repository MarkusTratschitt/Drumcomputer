import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import DualDisplay from '@/components/control/DualDisplay.vue'

describe('DualDisplay.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renders left and right displays', () => {
    const wrapper = mount(DualDisplay, {
      props: {
        leftModel: { view: 'BROWSER', title: 'Test Left' },
        rightModel: { view: 'FILE', title: 'Test Right' },
        modeTitle: 'Test Mode',
        pageLabel: 'Page 1'
      }
    })
    expect(wrapper.find('.display.left').exists()).toBe(true)
    expect(wrapper.find('.display.right').exists()).toBe(true)
  })

  it('shows file search input in FILE view', () => {
    const wrapper = mount(DualDisplay, {
      props: {
        leftModel: { view: 'FILE', title: 'Files', items: [] },
        rightModel: { view: 'BROWSER', title: 'Browser', items: [] },
        modeTitle: 'File Mode',
        pageLabel: 'Page 1'
      }
    })
    const searchInput = wrapper.find('.display.left input[type="search"]')
    expect(searchInput.exists()).toBe(true)
    expect(searchInput.attributes('placeholder')).toBe('Filter files')
  })

  it('renders scrollable file list wrapper in FILE view', () => {
    const items = Array.from({ length: 50 }, (_, i) => ({
      title: `File ${i + 1}`,
      subtitle: `path/to/file${i + 1}`
    }))
    const wrapper = mount(DualDisplay, {
      props: {
        leftModel: { view: 'FILE', title: 'Files', items },
        rightModel: { view: 'BROWSER', title: 'Browser', items: [] },
        modeTitle: 'File Mode',
        pageLabel: 'Page 1'
      }
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
    const wrapper = mount(DualDisplay, {
      props: {
        leftModel: { view: 'FILE', title: 'Files', items },
        rightModel: { view: 'BROWSER', title: 'Browser', items: [] },
        modeTitle: 'File Mode',
        pageLabel: 'Page 1'
      }
    })
    const searchInput = wrapper.find('.display.left input[type="search"]')
    await searchInput.setValue('kick')
    await wrapper.vm.$nextTick()
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
    const wrapper = mount(DualDisplay, {
      props: {
        leftModel: { view: 'BROWSER', title: 'Browser', items },
        rightModel: { view: 'FILE', title: 'Files', items: [] },
        modeTitle: 'Browser Mode',
        pageLabel: 'Page 1'
      }
    })
    const searchInput = wrapper.find('.display.left input[type="search"]')
    await searchInput.setValue('snare')
    await wrapper.vm.$nextTick()
    const visibleItems = wrapper.findAll('.display.left .item-list li')
    expect(visibleItems).toHaveLength(1)
    expect(visibleItems[0].text()).toContain('Snare Clap')
  })

  it('shows all FILE items when fileQuery is empty', async () => {
    const items = Array.from({ length: 10 }, (_, i) => ({
      title: `File ${i + 1}`,
      subtitle: `path/file${i + 1}`
    }))
    const wrapper = mount(DualDisplay, {
      props: {
        leftModel: { view: 'FILE', title: 'Files', items },
        rightModel: { view: 'BROWSER', title: 'Browser', items: [] },
        modeTitle: 'File Mode',
        pageLabel: 'Page 1'
      }
    })
    const visibleItems = wrapper.findAll('.display.left .item-list li')
    expect(visibleItems).toHaveLength(10)
  })

  it('renders FILE view in right panel with scroll wrapper', () => {
    const items = Array.from({ length: 20 }, (_, i) => ({
      title: `Dir ${i + 1}`,
      subtitle: `path/dir${i + 1}`
    }))
    const wrapper = mount(DualDisplay, {
      props: {
        leftModel: { view: 'BROWSER', title: 'Browser', items: [] },
        rightModel: { view: 'FILE', title: 'Files', items },
        modeTitle: 'File Mode',
        pageLabel: 'Page 1'
      }
    })
    const fileListWrapper = wrapper.find('.display.right .file-list-wrapper')
    expect(fileListWrapper.exists()).toBe(true)
    const visibleItems = wrapper.findAll('.display.right .item-list li')
    expect(visibleItems).toHaveLength(20)
  })

  it('applies active class to selected FILE items', () => {
    const items = [
      { title: 'File 1', subtitle: 'path/file1', active: false },
      { title: 'File 2', subtitle: 'path/file2', active: true },
      { title: 'File 3', subtitle: 'path/file3', active: false }
    ]
    const wrapper = mount(DualDisplay, {
      props: {
        leftModel: { view: 'BROWSER', title: 'Browser', items: [] },
        rightModel: { view: 'FILE', title: 'Files', items },
        modeTitle: 'File Mode',
        pageLabel: 'Page 1'
      }
    })
    const listItems = wrapper.findAll('.display.right .item-list li')
    expect(listItems[0].classes()).not.toContain('active')
    expect(listItems[1].classes()).toContain('active')
    expect(listItems[2].classes()).not.toContain('active')
  })

  it('formats param values correctly', () => {
    const wrapper = mount(DualDisplay, {
      props: {
        leftModel: { view: 'BROWSER', title: 'Browser', items: [] },
        rightModel: { view: 'FILE', title: 'Files', items: [] },
        modeTitle: 'Test',
        pageLabel: 'Page 1',
        paramSlotsLeft: [
          { id: 'p1', name: 'Volume', value: 75.456, format: 'dB' },
          { id: 'p2', name: 'Pan', value: 0.333 }
        ]
      }
    })
    const paramValues = wrapper.findAll('.display.left .param-value')
    expect(paramValues[0].text()).toBe('75.456dB')
    expect(paramValues[1].text()).toBe('0.33')
  })
})
