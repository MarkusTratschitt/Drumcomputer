import { computed, onBeforeUnmount, ref } from 'vue'
import { defaultMidiMapping } from '@/domain/midiMapping'
import type { MidiMessage, MidiMapping } from '@/types/midi'
import type { DrumPadId } from '@/types/drums'

type LearnTarget =
  | { type: 'pad'; padId: DrumPadId }
  | { type: 'transport'; action: 'play' | 'stop' | 'bpmUp' | 'bpmDown' }

const STORAGE_KEY = 'drumcomputer:midi-mapping'

const loadMapping = (): MidiMapping => {
  if (typeof localStorage === 'undefined') return defaultMidiMapping()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultMidiMapping()
    const parsed = JSON.parse(raw) as MidiMapping
    return {
      noteMap: parsed.noteMap ?? {},
      noteMapInverse: parsed.noteMapInverse ?? {},
      transportMap: parsed.transportMap ?? {}
    }
  } catch {
    return defaultMidiMapping()
  }
}

const persistMapping = (mapping: MidiMapping) => {
  if (typeof localStorage === 'undefined') return
  const payload: MidiMapping = {
    noteMap: mapping.noteMap ?? {},
    noteMapInverse: mapping.noteMapInverse ?? {},
    transportMap: mapping.transportMap ?? {}
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

export function useMidiLearn(midi: {
  mapping: { value: MidiMapping }
  setPadForNote: (note: number, padId: DrumPadId | undefined) => void
  mapNoteToPad: (note: number) => DrumPadId | undefined
  listen: (cb: (message: MidiMessage) => void) => () => void
}) {
  const isLearning = ref(false)
  const target = ref<LearnTarget | null>(null)
  const status = ref<string | null>(null)
  let unsubscribe: (() => void) | null = null

  // hydrate mapping once
  midi.mapping.value = loadMapping()

  const learningLabel = computed(() => {
    if (!isLearning.value || !target.value) return null
    if (target.value.type === 'pad') {
      return `Learning: ${target.value.padId}`
    }
    return `Learning: ${target.value.action}`
  })

  const clear = () => {
    target.value = null
    status.value = null
  }

  const midiListen = (cb: (message: MidiMessage) => void) => {
    return midi.listen ? midi.listen(cb) : () => undefined
  }

  const disable = () => {
    isLearning.value = false
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
    clear()
  }

  const enable = () => {
    if (isLearning.value) return
    isLearning.value = true
    unsubscribe = midiListen(handleMessage)
  }

  const setTarget = (next: LearnTarget | null) => {
    target.value = next
    status.value = null
  }

  const setTransportMapping = (
    action: 'play' | 'stop' | 'bpmUp' | 'bpmDown',
    note: number
  ) => {
    midi.mapping.value.transportMap = midi.mapping.value.transportMap ?? {}
    midi.mapping.value.transportMap[action] = note
    persistMapping(midi.mapping.value)
  }

  const handlePadMapping = (note: number, padId: DrumPadId) => {
    // clear previous reverse mapping to avoid conflicts
    if (midi.mapping.value.noteMapInverse?.[padId] !== undefined) {
      const prevNote = midi.mapping.value.noteMapInverse?.[padId]
      if (typeof prevNote === 'number') {
        delete midi.mapping.value.noteMap[prevNote]
      }
    }
    midi.mapping.value.noteMapInverse = midi.mapping.value.noteMapInverse ?? {}
    midi.mapping.value.noteMapInverse[padId] = note
    midi.mapping.value.noteMap[note] = padId
    midi.setPadForNote(note, padId)
    persistMapping(midi.mapping.value)
  }

  const handleMessage = (message: MidiMessage): boolean => {
    if (!isLearning.value || !target.value) return false
    if (message.type !== 'noteon' || typeof message.note !== 'number') {
      return false
    }

    if (target.value.type === 'pad') {
      handlePadMapping(message.note, target.value.padId)
      status.value = `Mapped ${target.value.padId} to note ${message.note}`
    } else {
      setTransportMapping(target.value.action, message.note)
      status.value = `Mapped ${target.value.action} to note ${message.note}`
    }

    clear()
    return true
  }

  onBeforeUnmount(() => {
    disable()
  })

  return {
    isLearning,
    target,
    status,
    learningLabel,
    enable,
    disable,
    setTarget,
    handleMessage,
    loadMapping,
    persistMapping
  }
}
