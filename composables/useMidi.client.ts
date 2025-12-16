import { ref } from 'vue'
import type { MidiDeviceInfo, MidiMapping, MidiMessage } from '~/types/midi'
import { defaultMidiMapping } from '~/domain/midiMapping'

export function useMidi() {
  const access = ref<MIDIAccess | null>(null)
  const inputs = ref<MidiDeviceInfo[]>([])
  const outputs = ref<MidiDeviceInfo[]>([])
  const mapping = ref<MidiMapping>(defaultMidiMapping())
  const selectedInputId = ref<string | null>(null)
  const selectedOutputId = ref<string | null>(null)
  const listeners = ref<Set<(message: MidiMessage) => void>>(new Set())

  const supportsMidi = () => typeof navigator !== 'undefined' && Boolean((navigator as Navigator).requestMIDIAccess)

  const refreshDevices = () => {
    if (!access.value) return
    inputs.value = Array.from(access.value.inputs.values()).map((device: MIDIInput) => ({
      id: device.id,
      name: device.name ?? 'MIDI In',
      type: 'input'
    }))
    outputs.value = Array.from(access.value.outputs.values()).map((device: MIDIOutput) => ({
      id: device.id,
      name: device.name ?? 'MIDI Out',
      type: 'output'
    }))
  }

  const requestAccess = async () => {
    if (!supportsMidi()) {
      return
    }
    access.value = await (navigator as Navigator).requestMIDIAccess({ sysex: false })
    refreshDevices()
    if (access.value) {
      access.value.onstatechange = () => {
        refreshDevices()
        attachSelectedInput()
      }
    }
  }

  const handleMidiMessage = (event: MIDIMessageEvent) => {
    if (!event.data || event.data.length < 1) return
    const status = event.data[0]
    const data1 = event.data[1]
    const data2 = event.data[2]
    if (status === undefined) return
    const type = status & 0xf0
    const message: MidiMessage | null =
      type === 0x90 && data2 > 0
        ? { type: 'noteon', note: data1, velocity: data2 / 127 }
        : type === 0x80 || (type === 0x90 && data2 === 0)
          ? { type: 'noteoff', note: data1, velocity: data2 / 127 }
          : status === 0xf8
            ? { type: 'clock' }
            : status === 0xfa
              ? { type: 'start' }
              : status === 0xfc
                ? { type: 'stop' }
                : null
    if (!message) return
    listeners.value.forEach((cb) => cb(message))
  }

  const detachInputs = () => {
    access.value?.inputs.forEach((input) => {
      input.onmidimessage = null
    })
  }

  const attachSelectedInput = () => {
    detachInputs()
    if (!selectedInputId.value) return
    const input = access.value?.inputs.get(selectedInputId.value)
    if (input) {
      input.onmidimessage = handleMidiMessage
    }
  }

  const listen = (cb: (message: MidiMessage) => void) => {
    listeners.value.add(cb)
    attachSelectedInput()
    return () => listeners.value.delete(cb)
  }

  const send = (deviceId: string, message: MidiMessage) => {
    const output = access.value?.outputs.get(deviceId)
    if (!output) return
    switch (message.type) {
      case 'noteon':
        output.send([0x90, message.note ?? 0, Math.floor((message.velocity ?? 1) * 127)])
        break
      case 'noteoff':
        output.send([0x80, message.note ?? 0, 0])
        break
      case 'start':
        output.send([0xfa])
        break
      case 'stop':
        output.send([0xfc])
        break
      case 'clock':
        output.send([0xf8])
        break
      default:
        break
    }
  }

  const sendClockTick = () => {
    if (selectedOutputId.value) {
      send(selectedOutputId.value, { type: 'clock' })
    }
  }

  const sendStart = () => {
    if (selectedOutputId.value) {
      send(selectedOutputId.value, { type: 'start' })
    }
  }

  const sendStop = () => {
    if (selectedOutputId.value) {
      send(selectedOutputId.value, { type: 'stop' })
    }
  }

  const setSelectedInput = (id: string | null) => {
    selectedInputId.value = id
    attachSelectedInput()
  }

  const setSelectedOutput = (id: string | null) => {
    selectedOutputId.value = id
  }

  const mapNoteToPad = (note: number) => mapping.value.noteMap[note]
  const setPadForNote = (note: number, padId: MidiMapping['noteMap'][number]) => {
    if (padId) {
      mapping.value.noteMap[note] = padId
    } else {
      delete mapping.value.noteMap[note]
    }
  }

  return {
    access,
    inputs,
    outputs,
    mapping,
    selectedInputId,
    selectedOutputId,
    supportsMidi,
    requestAccess,
    refreshDevices,
    listen,
    send,
    sendClockTick,
    sendStart,
    sendStop,
    mapNoteToPad,
    setPadForNote,
    setSelectedInput,
    setSelectedOutput
  }
}
