import { saveAs } from 'file-saver'
import type { Pattern } from '~/types/drums'
import type { MidiFileData } from '~/types/midi'

const encoderHeader = 'Drumcomputer Pattern Export'

export function useImportExport() {
  const exportPattern = (pattern: Pattern) => {
    const blob = new Blob([JSON.stringify(pattern, null, 2)], { type: 'application/json' })
    saveAs(blob, `${pattern.name}.json`)
  }

  const importPattern = async (file: File): Promise<Pattern> => {
    const text = await file.text()
    const parsed = JSON.parse(text) as Pattern
    return parsed
  }

  const exportMidi = (data: MidiFileData) => {
    const blob = new Blob([encoderHeader, JSON.stringify(data)], { type: 'application/json' })
    saveAs(blob, 'sequence.mid.json')
  }

  const exportAudio = (buffer: ArrayBuffer) => {
    const blob = new Blob([buffer], { type: 'audio/wav' })
    saveAs(blob, 'mixdown.wav')
  }

  return {
    exportPattern,
    importPattern,
    exportMidi,
    exportAudio
  }
}
