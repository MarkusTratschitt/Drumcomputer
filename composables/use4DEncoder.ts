import { computed, ref } from 'vue'

export type EncoderMode = 'field-select' | 'value-adjust' | 'list-navigate'

export interface EncoderField {
  id: string
  label: string
  value: string | number
  options?: string[]
  min?: number
  max?: number
  step?: number
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

export const use4DEncoder = () => {
  const mode = ref<EncoderMode>('field-select')
  const fields = ref<EncoderField[]>([])
  const activeFieldIndex = ref(0)
  const activeListIndex = ref(0)

  const activeField = computed(() => fields.value[activeFieldIndex.value] ?? null)

  const setFields = (nextFields: EncoderField[]) => {
    fields.value = [...nextFields]
    if (fields.value.length === 0) {
      activeFieldIndex.value = 0
      return
    }
    activeFieldIndex.value = clamp(activeFieldIndex.value, 0, fields.value.length - 1)
  }

  const setMode = (nextMode: EncoderMode) => {
    mode.value = nextMode
  }

  const tiltHorizontal = (direction: 'left' | 'right') => {
    if (fields.value.length === 0) return
    const delta = direction === 'left' ? -1 : 1
    const maxIndex = fields.value.length - 1
    activeFieldIndex.value = clamp(activeFieldIndex.value + delta, 0, maxIndex)
    mode.value = 'field-select'
  }

  const tiltVertical = (direction: 'up' | 'down') => {
    const delta = direction === 'up' ? -1 : 1
    activeListIndex.value = Math.max(0, activeListIndex.value + delta)
    mode.value = 'list-navigate'
  }

  const updateFieldValue = (delta: number) => {
    const index = activeFieldIndex.value
    const field = fields.value[index]
    if (!field) return
    if (field.options && field.options.length > 0) {
      const startIndex = Math.max(0, field.options.findIndex((option) => option === field.value))
      const nextIndex = clamp(startIndex + delta, 0, field.options.length - 1)
      const nextValue = field.options[nextIndex] ?? field.value
      fields.value.splice(index, 1, { ...field, value: nextValue })
      return
    }
    if (typeof field.value === 'number') {
      const step = field.step ?? 1
      const min = field.min ?? Number.NEGATIVE_INFINITY
      const max = field.max ?? Number.POSITIVE_INFINITY
      const nextValue = clamp(field.value + delta * step, min, max)
      fields.value.splice(index, 1, { ...field, value: nextValue })
    }
  }

  const turn = (delta: number) => {
    if (mode.value === 'list-navigate') {
      activeListIndex.value = Math.max(0, activeListIndex.value + delta)
      return
    }
    if (mode.value !== 'value-adjust') return
    updateFieldValue(delta)
  }

  const press = () => {
    if (mode.value === 'field-select') {
      mode.value = 'value-adjust'
      return
    }
    if (mode.value === 'value-adjust') {
      mode.value = 'list-navigate'
      return
    }
    mode.value = 'field-select'
  }

  return {
    mode,
    fields,
    activeFieldIndex,
    activeListIndex,
    activeField,
    tiltHorizontal,
    tiltVertical,
    turn,
    press,
    setFields,
    setMode
  }
}

export type Use4DEncoderReturn = ReturnType<typeof use4DEncoder>
