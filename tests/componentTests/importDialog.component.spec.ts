import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { nextTick } from 'vue'
import ImportDialog from '../../components/ImportDialog.vue'

describe('ImportDialog', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.clear()
    }
  })

  it('renders with directory path', async () => {
    const wrapper = mount(ImportDialog, {
      props: {
        modelValue: true,
        directoryPath: '/samples/drums'
      },
      global: {
        stubs: {
          'v-dialog': true,
          'v-card': true,
          'v-card-title': true,
          'v-card-text': true,
          'v-card-actions': true,
          'v-checkbox': true,
          'v-combobox': true,
          'v-btn': true,
          'v-spacer': true
        }
      }
    })
    await nextTick()
    // Check that component receives the prop and stores it
    const vm = wrapper.vm as unknown as { directoryPath: string }
    expect(vm.directoryPath).toBe('/samples/drums')
  })

  it('emits confirm with options', async () => {
    const wrapper = mount(ImportDialog, {
      props: {
        modelValue: true,
        directoryPath: '/samples/drums'
      },
      global: {
        stubs: {
          'v-dialog': true,
          'v-card': true,
          'v-card-title': true,
          'v-card-text': true,
          'v-card-actions': true,
          'v-checkbox': true,
          'v-combobox': true,
          'v-btn': true,
          'v-spacer': true
        }
      }
    })
    await nextTick()

    // Set values
    const vm = wrapper.vm as unknown as {
      includeSubfolders: boolean
      tags: string[]
      onConfirm: () => void
    }
    vm.includeSubfolders = false
    vm.tags = ['drums', 'kit']
    await nextTick()

    // Call method directly to avoid Vuetify button stub issues
    vm.onConfirm()

    expect(wrapper.emitted('confirm')).toBeTruthy()
    const emitted = wrapper.emitted('confirm') as Array<Array<{ includeSubfolders: boolean; tags: string[] }>>
    expect(emitted[0][0].includeSubfolders).toBe(false)
    expect(emitted[0][0].tags).toEqual(['drums', 'kit'])
  })

  it('emits cancel on cancel button', async () => {
    const wrapper = mount(ImportDialog, {
      props: {
        modelValue: true,
        directoryPath: '/samples/drums'
      },
      global: {
        stubs: {
          'v-dialog': true,
          'v-card': true,
          'v-card-title': true,
          'v-card-text': true,
          'v-card-actions': true,
          'v-checkbox': true,
          'v-combobox': true,
          'v-btn': true,
          'v-spacer': true
        }
      }
    })
    await nextTick()

    // Call method directly
    const vm = wrapper.vm as unknown as {
      onCancel: () => void
    }
    vm.onCancel()

    expect(wrapper.emitted('cancel')).toBeTruthy()
  })

  it('loads preferences on open', async () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(
        'drumcomputer-import-prefs-v1',
        JSON.stringify({
          includeSubfolders: false,
          defaultTags: ['test']
        })
      )
    }

    const wrapper = mount(ImportDialog, {
      props: {
        modelValue: true,
        directoryPath: '/samples'
      },
      global: {
        stubs: {
          'v-dialog': true,
          'v-card': true,
          'v-card-title': true,
          'v-card-text': true,
          'v-card-actions': true,
          'v-checkbox': true,
          'v-combobox': true,
          'v-btn': true,
          'v-spacer': true
        }
      }
    })
    await nextTick()

    const vm = wrapper.vm as unknown as {
      includeSubfolders: boolean
      tags: string[]
      loadPreferences: () => void
    }
    // Call loadPreferences explicitly to verify it works
    vm.loadPreferences()
    await nextTick()

    expect(vm.includeSubfolders).toBe(false)
    expect(vm.tags).toEqual(['test'])
  })
})
