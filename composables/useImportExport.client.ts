import { ref } from 'vue'
import { saveAs } from 'file-saver'
import MidiPkg, { Midi as MidiType } from '@tonejs/midi'
import { defaultMidiMapping } from '@/domain/midiMapping'
import { DEFAULT_GRID_SPEC, normalizeGridSpec } from '@/domain/timing'
import { clampVelocity, DEFAULT_STEP_VELOCITY } from '@/domain/velocity'
import { createRenderClock } from '@/domain/clock/renderClock'
import { createFxGraph, connectFxGraph, updateFxGraph } from '@/audio/fxGraph'
import { useAudioEngine } from './useAudioEngine.client'
import { usePatternsStore } from '@/stores/patterns'
import { useTransportStore } from '@/stores/transport'
import { createSeededRandom } from '@/utils/seededRandom'
import type { ScheduledTask } from './useScheduler'
import { scheduleStep } from './useSequencer'
import type { ScheduleStepOptions, ScheduledStep } from './useSequencer'
import type { GridSpec } from '@/types/time'
import type { MidiFileData, MidiMapping } from '@/types/midi'
import type { SampleRef, Soundbank } from '@/types/audio'
import type { RenderMetadata, RenderEvent } from '@/types/render'
import type { DrumPadId, Pattern } from '@/types/drums'

const Midi = (typeof MidiPkg !== 'undefined' && MidiPkg && MidiPkg.Midi) ? MidiPkg.Midi : undefined
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
      const channel = channels[i]
      if (!channel) {
        offset += 2
        continue
      }
      const sampleIndex = Math.floor((offset - 44) / (2 * numOfChan))
      const rawSample = channel[sampleIndex] ?? 0
      const sample = Math.max(-1, Math.min(1, rawSample))
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

const patternFromMidi = (midi: MidiType, mapping: MidiMapping): Pattern => {
  const gridSpec: GridSpec = { bars: 1, division: 16 }
  const steps: Pattern['steps'] = {}
  const track = midi.tracks[0]
  if (!track) {
    return normalizePattern({
      id: 'imported-pattern',
      name: 'Imported Pattern',
      gridSpec,
      steps
    })
  }
  const ticksPerBeat = midi.header.ppq
  const stepTicks = (ticksPerBeat * 4) / gridSpec.division
  const notes = track.notes ?? []
  interface Note {
    midi: number
    ticks: number
    velocity?: number
  }

  interface Steps {
    [barIndex: number]: {
      [stepInBar: number]: Partial<Record<DrumPadId, { velocity?: { value: number } }>>
    }
  }

  notes.forEach((note: Note) => {
    const stepIndex: number = Math.round(note.ticks / stepTicks)
    const barIndex: number = Math.floor(stepIndex / gridSpec.division)
    const stepInBar: number = stepIndex % gridSpec.division
    const pad: DrumPadId | undefined = mapping.noteMap[note.midi]
    if (!pad) return
    const bar: Steps[number] = steps[barIndex] ?? {}
    const row: Steps[number][number] = bar[stepInBar] ?? {}
    const velocity: number = typeof note.velocity === 'number' ? note.velocity : DEFAULT_STEP_VELOCITY
    row[pad] = { velocity: { value: clampVelocity(velocity) } }
    bar[stepInBar] = row
    steps[barIndex] = bar
  })
  return normalizePattern({
    id: 'imported-pattern',
    name: track.name ?? 'Imported Pattern',
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
    if (typeof Midi === 'undefined') {
      console.error('MIDI export is not available: Midi is undefined.')
      return
    }
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
        const drumPad = padId as DrumPadId
        const note = mapping.noteMapInverse?.[drumPad] ?? Object.entries(mapping.noteMap).find(([, pad]) => pad === drumPad)?.[0]
        if (typeof note !== 'string' && typeof note !== 'number') return
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
    const midiArray = midi.toArray()
    const midiBuffer = midiArray.buffer as ArrayBuffer
    const blob = new Blob([midiBuffer], { type: 'audio/midi' })
    saveAs(blob, `${pattern.name}.mid`)
  }

  const importMidi = async (file: File, mapping: MidiMapping = defaultMidiMapping()): Promise<Pattern> => {
    if (typeof Midi === 'undefined') {
      console.error('MIDI import is not available: Midi is undefined.')
      return {
        id: `imported-${Date.now()}`,
        name: file.name,
        gridSpec: { bars: 1, division: 16 },
        steps: {}
      }
    }
    const buffer = await file.arrayBuffer()
    const midi = new Midi(buffer)
    return patternFromMidi(midi, mapping)
  }

  const createScenePlaybackTracker = (patternsStore: ReturnType<typeof usePatternsStore>) => {
    const scene = patternsStore.currentScene
    const patternList = scene?.patternIds ?? []
    const fallbackPattern: Pattern = patternsStore.patterns[0] ?? {
      id: 'pattern-1',
      name: 'Pattern 1',
      gridSpec: { ...DEFAULT_GRID_SPEC },
      steps: {}
    }
    let currentPatternId = patternList[0] ?? patternsStore.selectedPatternId ?? fallbackPattern.id
    let scenePosition = patternList.length > 1 ? 1 : 0
    const resolvePattern = (id: string) => patternsStore.patterns.find((pattern) => pattern.id === id) ?? fallbackPattern
    const getPattern = () => resolvePattern(currentPatternId)
    const advancePattern = () => {
      if (!scene || patternList.length === 0) {
        return getPattern()
      }
      const nextId = patternList[scenePosition % patternList.length]
      scenePosition = (scenePosition + 1) % patternList.length
      if (nextId) {
        currentPatternId = nextId
      }
      return getPattern()
    }
    const initialPattern = getPattern()
    const patternChain = patternList.length > 0 ? [...patternList] : [patternsStore.selectedPatternId ?? initialPattern.id]
    return {
      sceneId: scene?.id ?? null,
      patternChain,
      initialPatternId: initialPattern.id,
      getPattern,
      advancePattern
    }
  }

  const createOfflineScheduler = (limit: number, updateClock: (time: number) => void) => {
    const tasks: ScheduledTask[] = []
    return {
      schedule(task: ScheduledTask) {
        tasks.push(task)
        tasks.sort((a, b) => a.when - b.when)
      },
      run() {
        while (tasks.length > 0) {
          const next = tasks[0]
          if (!next || next.when > limit) break
          tasks.shift()
          updateClock(next.when)
          next.callback()
        }
      }
    }
  }

  const hashSnapshot = (payload: string) => {
    let hash = 0
    for (let i = 0; i < payload.length; i += 1) {
      hash = Math.imul(31, hash) + payload.charCodeAt(i)
      hash >>>= 0
    }
    return hash.toString(36)
  }

  type StemExportFiles = Partial<Record<DrumPadId, { fileName: string; blob: Blob }>>

  type ExportAudioResult = {
    audioBlob: Blob
    metadata: RenderMetadata
    debugTimeline?: RenderEvent[]
    stems?: StemExportFiles
  }

  const slugifyName = (value: string) => {
    const cleaned = value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
    return cleaned || 'session'
  }

  const collectPadIdsFromPatternChain = (patternChain: string[], patternList: Pattern[]): DrumPadId[] => {
    const padSet = new Set<DrumPadId>()
    patternChain.forEach((patternId) => {
      const pattern = patternList.find((entry) => entry.id === patternId)
      if (!pattern) return
      Object.values(pattern.steps ?? {}).forEach((bar) => {
        Object.values(bar ?? {}).forEach((stepRow) => {
          Object.keys(stepRow ?? {}).forEach((padId) => {
            padSet.add(padId as DrumPadId)
          })
        })
      })
    })
    return Array.from(padSet)
  }

  const exportAudio = async (
    renderDurationSec: number,
    sampleRate = 44100,
    options: { seed?: number; stems?: boolean } = {}
  ): Promise<ExportAudioResult> => {
    const transport = useTransportStore()
    const patterns = usePatternsStore()
    const audio = useAudioEngine()
    const duration = Math.max(0, renderDurationSec)
    const frameCount = Math.max(1, Math.ceil(duration * sampleRate))
    const seedValue = options.seed ?? Date.now()
    const fxSnapshot = audio.getFxSnapshot()
    const shouldDebug = import.meta.env?.DEV ?? false
    const baseSampleCache = new Map(audio.sampleCache.value)

    const metadataTracker = createScenePlaybackTracker(patterns)
    const metadataPattern = metadataTracker.getPattern()
    const initialGridSpec = normalizeGridSpec(metadataPattern.gridSpec ?? transport.gridSpec)
    const metadata: RenderMetadata = {
      seed: String(seedValue),
      bpm: transport.bpm,
      gridSpec: initialGridSpec,
      sceneId: metadataTracker.sceneId,
      patternChain: metadataTracker.patternChain,
      initialPatternId: metadataTracker.initialPatternId,
      durationSec: duration
    }

    const songSlug = slugifyName(patterns.currentScene?.name ?? metadataPattern.name ?? 'drum-session')
    const candidatePadIds = collectPadIdsFromPatternChain(metadataTracker.patternChain, patterns.patterns)
    const stemPadIds = options.stems
      ? candidatePadIds.filter((padId) => baseSampleCache.has(padId))
      : []

    const renderPass = async (soloPadId?: DrumPadId, collectDebug = false) => {
      const context = new OfflineAudioContext(2, frameCount, sampleRate)
      const masterGainNode = context.createGain()
      masterGainNode.gain.value = 0.8
      masterGainNode.connect(context.destination)
      const fxGraph = createFxGraph(context)
      connectFxGraph(fxGraph, masterGainNode)

      const rng = createSeededRandom(seedValue)
      updateFxGraph(context, fxGraph, fxSnapshot, rng)

      const sampleCache = new Map(baseSampleCache)
      const shouldCollectDebugEvents = shouldDebug && collectDebug
      const debugEvents: RenderEvent[] = []

      const offlineEngine = {
        trigger({ padId, when, velocity = 1 }: { padId: DrumPadId; when: number; velocity?: number }) {
          if (soloPadId && padId !== soloPadId) return
          const buffer = sampleCache.get(padId)
          if (!buffer) return
          const source = context.createBufferSource()
          source.buffer = buffer
          const gainNode = context.createGain()
          gainNode.gain.value = velocity
          source.connect(gainNode)
          gainNode.connect(fxGraph.fxInput)
          source.start(when)
          if (shouldCollectDebugEvents) {
            debugEvents.push({ time: when, padId, velocity })
          }
        }
      }

      let simulatedTime = 0
      const baseClock = createRenderClock(context, true)
      const renderClock: ScheduleStepOptions['clock'] = {
        ctx: baseClock.ctx,
        isOffline: true,
        now: () => simulatedTime
      }

      const offlineScheduler = createOfflineScheduler(duration, (time) => {
        simulatedTime = time
      })

      const tracker = createScenePlaybackTracker(patterns)
      const initialPatternForRender = tracker.getPattern()
      const renderGridSpec = normalizeGridSpec(initialPatternForRender.gridSpec ?? transport.gridSpec)
      const currentStep = ref(0)
      const pendingSteps = ref<ScheduledStep[]>([])
      const offlineTransportBase = {
        loop: transport.loop,
        bpm: transport.bpm,
        gridSpec: renderGridSpec,
        setCurrentStep: () => { },
        setGridSpec(gridSpec: GridSpec) {
          offlineTransportBase.gridSpec = normalizeGridSpec(gridSpec)
        }
      }
      const offlineTransport = offlineTransportBase as unknown as ScheduleStepOptions['transport']

      const stepOptions: ScheduleStepOptions = {
        clock: renderClock,
        scheduler: offlineScheduler,
        audio: offlineEngine as ScheduleStepOptions['audio'],
        transport: offlineTransport,
        getPattern: () => tracker.getPattern(),
        currentStep,
        pendingSteps,
        onPatternBoundary: () => {
          const nextPattern = tracker.advancePattern()
          offlineTransport.setGridSpec(nextPattern.gridSpec)
          return nextPattern
        }
      }

      scheduleStep(stepOptions, 0)
      offlineScheduler.run()
      simulatedTime = duration

      const rendered = await context.startRendering()
      return {
        audioBuffer: rendered,
        debugEvents: shouldCollectDebugEvents ? debugEvents : undefined
      }
    }

    const mixdownResult = await renderPass(undefined, true)
    const mixdownBlob = new Blob([audioBufferToWav(mixdownResult.audioBuffer)], { type: 'audio/wav' })
    saveAs(mixdownBlob, 'mixdown.wav')

    if (shouldDebug) {
      const events = mixdownResult.debugEvents ?? []
      const snapshotHash = hashSnapshot(JSON.stringify(fxSnapshot))
      console.info(
        'Offline export',
        `seed=${seedValue}`,
        `snapshot=${snapshotHash}`,
        `events=${events.length}`,
        `duration=${duration.toFixed(2)}`
      )
      if (events.length === 0) {
        console.warn('Offline export scheduled zero events; verify the active pattern/scene contains steps')
      }
    }

    const stemFiles: StemExportFiles = {}
    for (const padId of stemPadIds) {
      const stemResult = await renderPass(padId)
      const stemBlob = new Blob([audioBufferToWav(stemResult.audioBuffer)], { type: 'audio/wav' })
      const fileName = `${songSlug}_${padId}.wav`
      stemFiles[padId] = { fileName, blob: stemBlob }
    }

    const result: ExportAudioResult = {
      audioBlob: mixdownBlob,
      metadata
    }
    if (shouldDebug && mixdownResult.debugEvents) {
      result.debugTimeline = mixdownResult.debugEvents
    }
    if (Object.keys(stemFiles).length > 0) {
      result.stems = stemFiles
    }
    return result
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
      samples: samples.map((sample) => {
        const entry: { id: string; name: string; format?: SampleRef['format'] } = {
          id: sample.id,
          name: sample.name
        }
        if (sample.format) {
          entry.format = sample.format
        }
        return entry
      })
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
        if (blob) {
          return { ...sample, blob }
        }
        return { ...sample }
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
