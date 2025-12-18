import { mount } from '@vue/test-utils'
import { expect } from 'chai'
import PadGrid from '../components/PadGrid.vue'
import type { DrumPadId } from '../types/drums'

describe('PadGrid', () => {
  const pads: DrumPadId[] = ['pad1', 'pad2', 'pad3', 'pad4']

  const padStates = {
    pad1: { label: 'Kick', isTriggered: false, isPlaying: false },
    pad2: { label: 'Snare', isTriggered: true, isPlaying: false }
  }

  it('renders one PadCell per pad', () => {
    const wrapper = mount(PadGrid, {
      props: {
        pads,
        padStates,
        selectedPad: null
      }
    })

    const cells = wrapper.findAllComponents({ name: 'PadCell' })
    expect(cells.length).to.equal(pads.length)
  })

  it('forwards pad:down event', async () => {
    const wrapper = mount(PadGrid, {
      props: {
        pads,
        padStates,
        selectedPad: null
      }
    })

    const firstCell = wrapper.findComponent({ name: 'PadCell' })
    await firstCell.vm.$emit('pad:down', 'pad1')

    const events = wrapper.emitted<'pad:down'>('pad:down')
    expect(events).to.exist
    expect(events?.[0]).to.deep.equal(['pad1'])
  })

  it('forwards pad:select event', async () => {
    const wrapper = mount(PadGrid, {
      props: {
        pads,
        padStates,
        selectedPad: null
      }
    })

    const firstCell = wrapper.findComponent({ name: 'PadCell' })
    await firstCell.vm.$emit('pad:select', 'pad2')

    const events = wrapper.emitted<'pad:select'>('pad:select')
    expect(events).to.exist
    expect(events?.[0]).to.deep.equal(['pad2'])
  })

  it('marks selected pad correctly', () => {
    const wrapper = mount(PadGrid, {
      props: {
        pads,
        padStates,
        selectedPad: 'pad2'
      }
    })

    const cells = wrapper.findAllComponents({ name: 'PadCell' })
    const selected = cells.find((cell) =>
      cell.classes().includes('is-selected')
    )

    expect(selected).to.exist
  })
})
