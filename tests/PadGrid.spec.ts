import { describe, it } from 'mocha'
import { expect } from 'chai'
import { mount } from '@vue/test-utils'
import PadGrid from '../components/PadGrid.vue'

describe('PadGrid', () => {
  const pads = ['pad1', 'pad2']

  it('renders PadCell components', () => {
    const wrapper = mount(PadGrid, {
      props: {
        pads,
        selectedPad: null,
        padStates: {}
      }
    })

    expect(wrapper.findAllComponents({ name: 'PadCell' })).to.have.lengthOf(2)
  })

  it('emits pad:select when PadCell emits', async () => {
    const wrapper = mount(PadGrid, {
      props: {
        pads,
        selectedPad: null,
        padStates: {}
      }
    })

    await wrapper.findComponent({ name: 'PadCell' }).vm.$emit('pad:select', 'pad1')

    expect(wrapper.emitted('pad:select')).to.have.lengthOf(1)
    expect(wrapper.emitted('pad:select')![0][0]).to.equal('pad1')
  })

  it('passes is-selected correctly', () => {
    const wrapper = mount(PadGrid, {
      props: {
        pads,
        selectedPad: 'pad1',
        padStates: {}
      }
    })

    const cells = wrapper.findAllComponents({ name: 'PadCell' })
    expect(cells[0].props('isSelected')).to.equal(true)
    expect(cells[1].props('isSelected')).to.equal(false)
  })
})
