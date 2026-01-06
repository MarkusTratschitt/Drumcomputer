import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PadCell from '@/components/PadCell.vue'

describe('PadCell', () => {
  it('renders label', () => {
    const wrapper = mount(PadCell, {
      props: {
        padId: 'pad1',
        label: 'Kick'
      }
    })

    expect(wrapper.text()).to.equal('Kick')
  })

  it('emits pad:down on pointerdown', async () => {
    const wrapper = mount(PadCell, {
      props: {
        padId: 'pad1',
        label: 'Kick'
      }
    })

    await wrapper.trigger('pointerdown')

    const emitted = wrapper.emitted('pad:down')

    expect(emitted).to.be.an('array')
    expect(emitted).to.have.lengthOf(1)
    if (emitted && emitted[0]) {
      expect(emitted[0][0]).to.equal('pad1')
    }
  })

  it('applies is-playing class', () => {
    const wrapper = mount(PadCell, {
      props: {
        padId: 'pad1',
        label: 'Kick',
        isPlaying: true
      }
    })

    expect(wrapper.classes()).to.include('is-playing')
  })
})
