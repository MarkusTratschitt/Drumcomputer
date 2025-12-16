import { saveAs } from 'file-saver'
import { Midi } from '@tonejs/midi'
import { defaultMidiMapping } from '~/domain/midiMapping'
import { normalizeGridSpec } from '~/domain/timing'
import { clampVelocity, DEFAULT_STEP_VELOCITY } from '~/domain/velocity'
import type { Pattern } from '~/types/drums'
import type { DrumPadId } from '~/types/drums'
import type { GridSpec } from '~/types/time'
import type { MidiFileData, MidiMapping } from '~/types/midi'
import type { SampleRef, Soundbank } from '~/types/audio'

const encoderHeader = 'Drumcomputer Pattern Export'

const audioBufferToWav = (buffer: AudioBuffer) => {
  const numOfChan = buffer.numberOfChannels
  const length = buffer.length * numOfChan * 2 + 44
  const result = new ArrayBuffer(length)
  const view = new DataView(result)
  let offset = 0

  const writeString = (str: string) => {
    for (let i = 0; i < str.length; i += 1) {
      view.setUint8(offset + i, str.charCodeAt(i))
    }
    offset += str.length
  }

  const setUint16 = (data: number) => {
    view.setUint16(offset, data, true)
    offset += 2
  }

  const setUint32 = (data: number) => {
    view.setUint32(offset, data, true)
    offset += 4
  }

  writeString('RIFF')
  setUint32(length - 8)
  writeString('WAVE')
  writeString('fmt ')
  setUint32(16)
  setUint16(1)
  setUint16(numOfChan)
  setUint32(buffer.sampleRate)
  setUint32(buffer.sampleRate * numOfChan * 2)
  setUint16(numOfChan * 2)
  setUint16(16)
  writeString('data')
  setUint32(length - offset - 4)

  const channels: Float32Array[] = []
  for (let i = 0; i < numOfChan; i += 1) {
    channels.push(buffer.getChannelData(i))
  }

  while (offset < length) {
    for (let i = 0; i < numOfChan; i += 1) {
      const sample = Math.max(-1, Math.min(1, channels[i][(offset - 44) / (2 * numOfChan)]))
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
      offset += 2
    }
  }
  return result
}

const normalizePattern = (pattern: Pattern): Pattern => {
  const gridSpec: GridSpec = normalizeGridSpec(pattern.gridSpec)
  const steps: Pattern['steps'] = {}
  Object.entries(pattern.steps ?? {}).forEach(([barKey, barValue]) => {
    const barIndex = Number(barKey)
    if (Number.isNaN(barIndex)) return
    const normalizedBar: Record<number, Partial<Record<DrumPadId, { velocity?: { value: number } }>>> = {}
    Object.entries(barValue ?? {}).forEach(([stepKey, stepValue]) => {
      const stepInBar = Number(stepKey)
      if (Number.isNaN(stepInBar)) return
      const normalizedRow: Partial<Record<DrumPadId, { velocity?: { value: number } }>> = {}
      Object.entries(stepValue ?? {}).forEach(([padId, cell]) => {
        if (!cell) return
        normalizedRow[padId as DrumPadId] = {
          velocity: { value: clampVelocity(cell.velocity?.value ?? DEFAULT_STEP_VELOCITY) }
        }
      })
      if (Object.keys(normalizedRow).length > 0) {
        normalizedBar[stepInBar] = normalizedRow
      }
    })
    if (Object.keys(normalizedBar).length > 0) {
      steps[barIndex] = normalizedBar
    }
  })
  return {
    ...pattern,
    gridSpec,
    steps
  }
}

const patternFromMidi = (midi: Midi, mapping: MidiMapping): Pattern => {
  const gridSpec: GridSpec = { bars: 1, division: 16 }
  const steps: Pattern['steps'] = {}
  const track = midi.tracks[0]
  const ticksPerBeat = midi.header.ppq
  const stepTicks = (ticksPerBeat * 4) / gridSpec.division
  track.notes.forEach((note) => {
    const stepIndex = Math.round(note.ticks / stepTicks)
    const barIndex = Math.floor(stepIndex / gridSpec.division)
    const stepInBar = stepIndex % gridSpec.division
    const pad = mapping.noteMap[note.midi]
    if (!pad) return
    const bar = steps[barIndex] ?? {}
    const row = bar[stepInBar] ?? {}
    row[pad] = { velocity: { value: clampVelocity(note.velocity) } }
    bar[stepInBar] = row
    steps[barIndex] = bar
  })
  return normalizePattern({
    id: 'imported-pattern',
    name: track?.name || 'Imported Pattern',
    gridSpec,
    steps
  })
}

export function useImportExport() {
  const exportPattern = (pattern: Pattern) => {
    const normalized = normalizePattern(pattern)
    const blob = new Blob([JSON.stringify(normalized, null, 2)], { type: 'application/json' })
    saveAs(blob, `${normalized.name}.json`)
  }

  const importPattern = async (file: File): Promise<Pattern> => {
    try {
      const text = await file.text()
      const parsed = JSON.parse(text) as Pattern
      return normalizePattern(parsed)
    } catch (error) {
      console.error('Failed to import pattern', error)
      return {
        id: `imported-${Date.now()}`,
        name: file.name,
        gridSpec: { bars: 1, division: 16 },
        steps: {}
      }
    }
  }

  const exportMidi = (pattern: Pattern, bpm: number, mapping: MidiMapping = defaultMidiMapping()) => {
    const midi = new Midi()
    midi.header.setTempo(bpm)
    const track = midi.addTrack()
    const ticksPerBeat = midi.header.ppq
    const stepTicks = (ticksPerBeat * 4) / pattern.gridSpec.division
    const totalSteps = pattern.gridSpec.bars * pattern.gridSpec.division
    for (let i = 0; i < totalSteps; i += 1) {
      const barIndex = Math.floor(i / pattern.gridSpec.division)
      const stepInBar = i % pattern.gridSpec.division
      const row = pattern.steps[barIndex]?.[stepInBar]
      if (!row) continue
      Object.entries(row).forEach(([padId, cell]) => {
        const note = mapping.noteMapInverse?.[padId] ?? Object.entries(mapping.noteMap).find(([, pad]) => pad === padId)?.[0]
        const midiNote = typeof note === 'string' ? Number(note) : note
        if (typeof midiNote !== 'number') return
        track.addNote({
          midi: midiNote,
          time: (i * stepTicks) / ticksPerBeat,
          duration: stepTicks / ticksPerBeat,
          velocity: cell?.velocity?.value ?? 1
        })
      })
    }
    const blob = new Blob([midi.toArray()], { type: 'audio/midi' })
    saveAs(blob, `${pattern.name}.mid`)
  }

  const importMidi = async (file: File, mapping: MidiMapping = defaultMidiMapping()): Promise<Pattern> => {
    const buffer = await file.arrayBuffer()
    const midi = new Midi(buffer)
    return patternFromMidi(midi, mapping)
  }

  const exportAudio = async (renderDurationSec: number, renderGraph: (context: OfflineAudioContext) => void, sampleRate = 44100) => {
    const context = new OfflineAudioContext(2, renderDurationSec * sampleRate, sampleRate)
    renderGraph(context)
    const rendered = await context.startRendering()
    const wav = audioBufferToWav(rendered)
    const blob = new Blob([wav], { type: 'audio/wav' })
    saveAs(blob, 'mixdown.wav')
  }

  const exportSoundbank = (bank: Soundbank, samples: SampleRef[]) => {
    const padEntries = Object.entries(bank.pads).reduce<Record<string, { id: string; name: string; format?: SampleRef['format'] }>>((acc, [padId, sample]) => {
      if (sample) {
        acc[padId] = { id: sample.id, name: sample.name, format: sample.format }
      }
      return acc
    }, {})
    const manifest = {
      bank: { ...bank, pads: padEntries },
      samples: samples.map((sample) => ({
        id: sample.id,
        name: sample.name,
        format: sample.format
      }))
    }
    saveAs(new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' }), `${bank.name}-manifest.json`)
    samples.forEach((sample) => {
      if (sample.blob) {
        saveAs(sample.blob, sample.name)
      }
    })
  }

  const importSoundbank = async (manifestFile: File, sampleFiles: File[]): Promise<{ bank: Soundbank; samples: SampleRef[] }> => {
    try {
      const manifestText = await manifestFile.text()
      const parsed = JSON.parse(manifestText) as { bank: Soundbank; samples: Array<Pick<SampleRef, 'id' | 'name' | 'format'>> }
      const sampleMap = new Map(sampleFiles.map((file) => [file.name, file]))
      const hydratedSamples: SampleRef[] = parsed.samples.map((sample) => {
        const blob = sampleMap.get(sample.name)
        return { ...sample, blob: blob ?? undefined }
      })
      const padAssignments: Partial<Record<string, SampleRef>> = {}
      Object.entries(parsed.bank.pads ?? {}).forEach(([padId, sampleInfo]) => {
        const found = hydratedSamples.find((sample) => sample.id === (sampleInfo as SampleRef).id)
        if (found) {
          padAssignments[padId] = found
        }
      })
      const hydratedBank: Soundbank = { ...parsed.bank, pads: padAssignments }
      return { bank: hydratedBank, samples: hydratedSamples }
    } catch (error) {
      console.error('Failed to import soundbank', error)
      return {
        bank: { id: 'invalid-bank', name: manifestFile.name, pads: {}, createdAt: Date.now(), updatedAt: Date.now() },
        samples: []
      }
    }
  }

  const exportMidiData = (data: MidiFileData) => {
    const blob = new Blob([encoderHeader, JSON.stringify(data)], { type: 'application/json' })
    saveAs(blob, 'sequence.mid.json')
  }

  return {
    exportPattern,
    importPattern,
    exportMidi,
    importMidi,
    exportMidiData,
    exportAudio,
    exportSoundbank,
    importSoundbank
  }
}
