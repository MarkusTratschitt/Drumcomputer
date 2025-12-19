import type { MidiMapping } from '@/types/midi'
import type { DrumPadId } from '@/types/drums'

const defaultPads: DrumPadId[] = [
  'pad1',
  'pad2',
  'pad3',
  'pad4',
  'pad5',
  'pad6',
  'pad7',
  'pad8',
  'pad9',
  'pad10',
  'pad11',
  'pad12',
  'pad13',
  'pad14',
  'pad15',
  'pad16'
]

export function defaultMidiMapping(): MidiMapping {
  const noteMap: Partial<Record<number, DrumPadId>> = {}
  const noteMapInverse: Partial<Record<DrumPadId, number>> = {}
  defaultPads.forEach((padId, index) => {
    const note = 36 + index
    noteMap[note] = padId
    noteMapInverse[padId] = note
  })
  return { noteMap, noteMapInverse, transportMap: {} }
}
