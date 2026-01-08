import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import FourDEncoder from '@/components/control/FourDEncoder.vue'
import { createPinia, setActivePinia } from 'pinia'
import { useControlStore } from '@/stores/control'

describe('FourDEncoder', () => {
  const setup = () => {
    setActivePinia(createPinia())
    const control = useControlStore()
    vi.spyOn(control, 'turnEncoder4D')
    vi.spyOn(control, 'tiltEncoder4D')
    vi.spyOn(control, 'pressEncoder4D')
    const wrapper = mount(FourDEncoder)
    return { wrapper, control }
  }

  it('turns on wheel equivalent via key arrows', async () => {
    const { wrapper, control } = setup()
    await wrapper.trigger('keydown', { key: 'ArrowUp' })
    expect(control.turnEncoder4D).toHaveBeenCalledWith(1)
  })

  it('tilts on horizontal key arrows', async () => {
    const { wrapper, control } = setup()
    await wrapper.trigger('keydown', { key: 'ArrowLeft' })
    expect(control.tiltEncoder4D).toHaveBeenCalledWith('left')
  })

  it('presses on Enter/Space', async () => {
    const { wrapper, control } = setup()
    await wrapper.trigger('keydown', { key: 'Enter' })
    expect(control.pressEncoder4D).toHaveBeenCalled()
  })

  it('drags vertically to turn and horizontally to tilt', async () => {
    const { wrapper, control } = setup()
    const el = wrapper.element as HTMLElement

    el.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, clientY: 100, pointerId: 1, bubbles: true }))
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 100, clientY: 82, pointerId: 1 }))
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: 120, clientY: 82, pointerId: 1 }))
    window.dispatchEvent(new PointerEvent('pointerup', { clientX: 120, clientY: 82, pointerId: 1 }))

    expect(control.turnEncoder4D).toHaveBeenCalled()
    expect(control.tiltEncoder4D).toHaveBeenCalled()
  })
})
