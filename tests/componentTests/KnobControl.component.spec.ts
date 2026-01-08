import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import KnobControl from '@/components/KnobControl.vue'

const baseProps = {
  index: 0,
  label: 'Volume',
  value: 50,
  min: 0,
  max: 100,
  step: 1
}

describe('KnobControl', () => {
  it('sets rotation style based on value', () => {
    const wrapper = mount(KnobControl, { props: baseProps })

    expect(wrapper.attributes('style')).toContain('--knob-angle: 0deg')
  })

  it('emits turn on wheel', async () => {
    const wrapper = mount(KnobControl, { props: baseProps })

    await wrapper.trigger('wheel', { deltaY: -120 })

    const emitted = wrapper.emitted('turn') as Array<[{ delta: number; fine: boolean }]>
    expect(emitted?.[0]?.[0]).toMatchObject({ delta: 2, fine: false })
  })

  it('emits turn on pointer drag', async () => {
    const wrapper = mount(KnobControl, { props: baseProps })

    await wrapper.trigger('pointerdown', { clientY: 100, pointerId: 1 })
    window.dispatchEvent(new PointerEvent('pointermove', { clientY: 88, pointerId: 1 }))
    window.dispatchEvent(new PointerEvent('pointerup', { clientY: 88, pointerId: 1 }))
    await nextTick()

    const turnEvents = wrapper.emitted('turn') as Array<[{ delta: number; fine: boolean }]>
    const payload = turnEvents?.find((entry) => (entry?.[0]?.delta ?? 0) !== 0)?.[0]

    expect(payload?.delta).to.equal(2)
  })

  it('uses fine mode when shiftHeld on keyboard', async () => {
    const wrapper = mount(KnobControl, { props: { ...baseProps, shiftHeld: true } })

    await wrapper.trigger('keydown', { key: 'ArrowUp' })

    const emitted = wrapper.emitted('turn') as Array<[{ delta: number; fine: boolean }]>
    expect(emitted?.[0]?.[0]).toMatchObject({ delta: 1, fine: true })
  })
})
