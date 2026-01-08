import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PadGrid from '@/components/PadGrid.vue'
import type { DrumPadId } from '@/types/drums'


describe('PadGrid', () => {
  const pads: DrumPadId[] = ['pad1', 'pad2']

  it('renders PadCell components', () => {
    const wrapper = mount(PadGrid, {
      props: { pads, selectedPad: null, padStates: {} }
    })

    expect(wrapper.findAllComponents({ name: 'PadCell' }))
      .to.have.lengthOf(2)
  })

  it('emits pad:select when PadCell emits', async () => {
    const wrapper = mount(PadGrid, {
      props: { pads, selectedPad: null, padStates: {} }
    })

    await wrapper.findComponent({ name: 'PadCell' })
      .vm.$emit('pad:select', 'pad1')

    const emitted = wrapper.emitted('pad:select') as unknown[][]
    const payload = emitted?.[0]?.[0]
    expect(emitted).to.be.an('array')
    expect(emitted!.length).to.equal(1)
    expect(payload).to.equal('pad1')

  })

  it('passes is-selected correctly', () => {
    const wrapper = mount(PadGrid, {
      props: { pads, selectedPad: 'pad1', padStates: {} }
    })

    const cells = wrapper.findAllComponents({ name: 'PadCell' })
    expect(cells).to.have.lengthOf(2)

    expect(cells[0]!.props('isSelected')).to.equal(true)
    expect(cells[1]!.props('isSelected')).to.equal(false)
  })
})
