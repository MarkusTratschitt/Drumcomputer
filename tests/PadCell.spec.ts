import { mount } from '@vue/test-utils'
import { expect } from 'chai'
import PadCell from '../components/PadCell.vue'
import type { DrumPadId } from '../types/drums'

describe('PadCell', () => {
  const padId: DrumPadId = 'pad1'

  it('renders label', () => {
    const wrapper = mount(PadCell, {
      props: {
        padId,
        label: 'Kick'
      }
    })

    expect(wrapper.text()).to.include('Kick')
  })

  it('emits pad:down on pointerdown', async () => {
    const wrapper = mount(PadCell, {
      props: {
        padId,
        label: 'Kick'
      }
    })

    await wrapper.trigger('pointerdown')

    const events = wrapper.emitted<'pad:down'>('pad:down')
    expect(events).to.exist
    expect(events?.[0]).to.deep.equal([padId])
  })

  it('emits pad:select on click', async () => {
    const wrapper = mount(PadCell, {
      props: {
        padId,
        label: 'Kick'
      }
    })

    await wrapper.trigger('click')

    const events = wrapper.emitted<'pad:select'>('pad:select')
    expect(events).to.exist
    expect(events?.[0]).to.deep.equal([padId])
  })

  it('applies state classes', () => {
    const wrapper = mount(PadCell, {
      props: {
        padId,
        label: 'Kick',
        isSelected: true,
        isTriggered: true,
        isPlaying: true
      }
    })

    expect(wrapper.classes()).to.include('is-selected')
    expect(wrapper.classes()).to.include('is-triggered')
    expect(wrapper.classes()).to.include('is-playing')
  })
})
