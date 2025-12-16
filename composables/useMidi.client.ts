import { ref } from 'vue'
import type { MidiDeviceInfo, MidiMapping, MidiMessage } from '~/types/midi'
import { defaultMidiMapping } from '~/domain/midiMapping'

export function useMidi() {
  const access = ref<WebMidi.MIDIAccess | null>(null)
  const inputs = ref<MidiDeviceInfo[]>([])
  const outputs = ref<MidiDeviceInfo[]>([])
  const mapping = ref<MidiMapping>(defaultMidiMapping())

  const supportsMidi = () => typeof navigator !== 'undefined' && Boolean((navigator as Navigator).requestMIDIAccess)

  const refreshDevices = () => {
    if (!access.value) return
    inputs.value = Array.from(access.value.inputs.values()).map((device) => ({
      id: device.id,
      name: device.name ?? 'MIDI In',
      type: 'input'
    }))
    outputs.value = Array.from(access.value.outputs.values()).map((device) => ({
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
  }

  const listen = (cb: (message: MidiMessage) => void) => {
    access.value?.inputs.forEach((input) => {
      input.onmidimessage = (event) => {
        const [status, data1, data2] = event.data
        const type = status & 0xf0
        if (type === 0x90 && data2 > 0) {
          cb({ type: 'noteon', note: data1, velocity: data2 / 127 })
        } else if (type === 0x80 || (type === 0x90 && data2 === 0)) {
          cb({ type: 'noteoff', note: data1, velocity: data2 / 127 })
        } else if (status === 0xf8) {
          cb({ type: 'clock' })
        } else if (status === 0xfa) {
          cb({ type: 'start' })
        } else if (status === 0xfc) {
          cb({ type: 'stop' })
        }
      }
    })
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

  const mapNoteToPad = (note: number) => mapping.value.noteMap[note]

  return {
    access,
    inputs,
    outputs,
    mapping,
    supportsMidi,
    requestAccess,
    refreshDevices,
    listen,
    send,
    mapNoteToPad
  }
}
