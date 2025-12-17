<template lang="pug">
.drumshell
  .hardware-top
    TransportBar(
      :bpm="bpm"
      :isPlaying="isPlaying"
      :loop="transport.loop"
      :division="gridSpec.division"
      :divisions="divisions"
      @play="start"
      @stop="stop"
      @bpm:update="updateBpm"
      @loop:update="setLoop"
      @division:update="setDivision"
    )
  .main-shell
    .pads-panel
      PadGrid(
        :pads="pads"
        :selected-pad="selectedPadId"
        :pad-states="padStates"
        @pad:down="handlePad"
        @pad:select="selectPad"
      )
    .sequencer-panel
      StepGrid(
        :grid-spec="gridSpec"
        :steps="pattern.steps"
        :selected-pad="selectedPadId"
        :current-step="currentStep"
        :is-playing="isPlaying"
        @step:toggle="toggleStep"
      )
  .drawer-wrapper
    TabPanel(v-model="drawerTab")
      template(#sound)
        SoundPanel(
          :banks="banks"
          :selected-bank-id="soundbanks.selectedBankId"
          @bank:select="selectBank"
          @pad:replace="replacePadSample"
        )
      template(#fx)
        FxPanel(:fxSettings="sequencer.fxSettings" @fx:update="updateFx")
      template(#patterns)
        PatternsPanel(
          :patterns="patterns.patterns"
          :selected-pattern-id="patterns.selectedPatternId"
          :scenes="patterns.scenes"
          :active-scene-id="patterns.activeSceneId"
          @pattern:add="addPattern"
          @pattern:select="selectPattern"
          @pattern:rename="renamePattern"
          @pattern:undo="undoPattern"
          @pattern:redo="redoPattern"
          @scene:add="addScene"
          @scene:update="updateScene"
          @scene:select="selectScene"
        )
      template(#export)
        ExportPanel(
          :isExporting="isExporting"
          :exportError="exportError"
          :exportMetadata="exportMetadata"
          :audioBlob="exportAudioBlob"
          :hasZipArtifacts="hasZipArtifacts"
          :stemEntries="stemEntries"
          @export="exportBounce"
          @download:mixdown="downloadMixdown"
          @download:zip="downloadZip"
          @download:stem="downloadStem"
          @download:stems="downloadAllStems"
        )
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { saveAs } from 'file-saver'
import { DEFAULT_GRID_SPEC, GRID_DIVISIONS, normalizeGridSpec } from '~/domain/timing'
import { useTransportStore } from '~/stores/transport'
import { usePatternsStore } from '~/stores/patterns'
import { useSoundbanksStore } from '~/stores/soundbanks'
import { useSessionStore } from '~/stores/session'
import { useSequencer } from '~/composables/useSequencer'
import { useSync } from '~/composables/useSync.client'
import { useMidi } from '~/composables/useMidi.client'
import { usePatternStorage } from '~/composables/usePatternStorage.client'
import { useSoundbankStorage } from '~/composables/useSoundbankStorage.client'
import { useImportExport } from '~/composables/useImportExport.client'
import { useCapabilities } from '~/composables/useCapabilities.client'
import TransportBar from './TransportBar.vue'
import PadGrid from './PadGrid.vue'
import StepGrid from './StepGrid.vue'
import TabPanel from './TabPanel.vue'
import SoundPanel from './panels/SoundPanel.vue'
import FxPanel from './panels/FxPanel.vue'
import PatternsPanel from './panels/PatternsPanel.vue'
import ExportPanel from './panels/ExportPanel.vue'
import { createZip, type ZipEntry } from '~/utils/zip'
import type { DrumPadId, Scene } from '~/types/drums'
import type { TimeDivision } from '~/types/time'
import type { FxSettings, SampleRef, Soundbank } from '~/types/audio'
import type { RenderEvent, RenderMetadata } from '~/types/render'

const slugify = (value: string): string => {
  const cleaned = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
  return cleaned || 'drum-session'
}

type StemFiles = Record<
  DrumPadId,
  {
    fileName: string
    blob: Blob
  }
>

type StemEntry = {
  padId: DrumPadId
  label: string
  fileName: string
}

type PadState = {
  label: string
  isTriggered: boolean
  isPlaying: boolean
}

const VISIBLE_DIVISIONS: TimeDivision[] = GRID_DIVISIONS.filter((value) => value <= 16)

export default defineComponent({
  name: 'DrumMachine',
  components: {
    TransportBar,
    PadGrid,
    StepGrid,
    TabPanel,
    SoundPanel,
    FxPanel,
    PatternsPanel,
    ExportPanel
  },
  data() {
    const transport = useTransportStore()
    const patterns = usePatternsStore()
    const soundbanks = useSoundbanksStore()
    const session = useSessionStore()
    const capabilitiesProbe = useCapabilities()
    session.setCapabilities(capabilitiesProbe.capabilities.value)

    const importExport = useImportExport()
    const sequencer = useSequencer({
      getPattern: () => patterns.currentPattern,
      onPatternBoundary: () => patterns.advanceScenePlayback()
    })
    const midi = useMidi()
    const handleExternalStart = () => {
      if (!transport.isPlaying) {
        patterns.prepareScenePlayback()
        sequencer.start()
      }
    }
    const handleExternalStop = () => {
      if (transport.isPlaying) {
        sequencer.stop()
      }
    }
    const sync = useSync('internal', {
      midi,
      getAudioTime: () => sequencer.getAudioTime(),
      onExternalStart: handleExternalStart,
      onExternalStop: handleExternalStop
    })
    const patternStorage = usePatternStorage()
    const soundbankStorage = useSoundbankStorage()

    const pads: DrumPadId[] = [
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
    const divisions: TimeDivision[] = [...VISIBLE_DIVISIONS]
    const defaultBank: Soundbank = {
      id: 'default-kit',
      name: 'Default Kit',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      pads: {
        pad1: { id: 'kick', name: 'Kick', url: '/samples/kick.wav', format: 'wav' },
        pad5: { id: 'kick-2', name: 'Kick 2', url: '/samples/kick.wav', format: 'wav' },
        pad9: { id: 'kick-3', name: 'Kick 3', url: '/samples/kick.wav', format: 'wav' },
        pad13: { id: 'kick-4', name: 'Kick 4', url: '/samples/kick.wav', format: 'wav' },
        pad2: { id: 'snare', name: 'Snare', url: '/samples/snare.wav', format: 'wav' },
        pad6: { id: 'snare-2', name: 'Snare 2', url: '/samples/snare.wav', format: 'wav' },
        pad10: { id: 'snare-3', name: 'Snare 3', url: '/samples/snare.wav', format: 'wav' },
        pad14: { id: 'snare-4', name: 'Snare 4', url: '/samples/snare.wav', format: 'wav' },
        pad3: { id: 'hihat', name: 'Hi-Hat', url: '/samples/hihat.wav', format: 'wav' },
        pad7: { id: 'hihat-2', name: 'Hi-Hat 2', url: '/samples/hihat.wav', format: 'wav' },
        pad11: { id: 'hihat-3', name: 'Hi-Hat 3', url: '/samples/hihat.wav', format: 'wav' },
        pad15: { id: 'hihat-4', name: 'Hi-Hat 4', url: '/samples/hihat.wav', format: 'wav' },
        pad4: { id: 'clap', name: 'Clap', url: '/samples/clap.wav', format: 'wav' },
        pad8: { id: 'clap-2', name: 'Clap 2', url: '/samples/clap.wav', format: 'wav' },
        pad12: { id: 'clap-3', name: 'Clap 3', url: '/samples/clap.wav', format: 'wav' },
        pad16: { id: 'clap-4', name: 'Clap 4', url: '/samples/clap.wav', format: 'wav' }
      }
    }

    if (soundbanks.banks.length === 0) {
      soundbanks.setBanks([defaultBank])
    }

    return {
      transport,
      patterns,
      soundbanks,
      session,
      sequencer,
      sync,
      midi,
      patternStorage,
      soundbankStorage,
      pads,
      divisions,
      defaultBank,
      unwatchers: [] as Array<() => void>,
      exportMetadata: null as RenderMetadata | null,
      exportAudioBlob: null as Blob | null,
      exportTimeline: undefined as RenderEvent[] | undefined,
      exportStems: null as StemFiles | null,
      isExporting: false,
      exportError: null as string | null,
      exportAudioFn: importExport.exportAudio,
      selectedPadId: 'pad1' as DrumPadId,
      drawerTab: 'sound'
    }
  },
  computed: {
    gridSpec() {
      return this.patterns.currentPattern?.gridSpec ?? { ...DEFAULT_GRID_SPEC }
    },
    pattern() {
      return this.patterns.currentPattern ?? { id: 'pattern-1', name: 'Pattern 1', gridSpec: { ...DEFAULT_GRID_SPEC }, steps: {} }
    },
    currentStep() {
      return this.transport.currentStep
    },
    bpm() {
      return this.transport.bpm
    },
    isPlaying() {
      return this.transport.isPlaying
    },
    midiInputs() {
      return this.midi.inputs
    },
    midiOutputs() {
      return this.midi.outputs
    },
    banks() {
      return this.soundbanks.banks
    },
    syncState() {
      return this.sync.state
    },
    capabilities() {
      return this.session.capabilities
    },
    padStates(): Record<DrumPadId, PadState> {
      const bankPads = this.soundbanks.currentBank?.pads ?? {}
      const result: Record<DrumPadId, PadState> = {} as Record<DrumPadId, PadState>
      const stepsPerPattern = Math.max(1, this.gridSpec.bars * this.gridSpec.division)
      const normalizedStep = ((this.currentStep % stepsPerPattern) + stepsPerPattern) % stepsPerPattern
      const barIndex = Math.floor(normalizedStep / this.gridSpec.division)
      const stepIndex = normalizedStep % this.gridSpec.division
      const currentRow = this.pattern.steps[barIndex]?.[stepIndex] ?? {}
      const triggered = new Set<DrumPadId>(Object.keys(currentRow) as DrumPadId[])
      const playingPads = new Set<DrumPadId>()
      Object.values(this.pattern.steps).forEach((bar) => {
        Object.values(bar).forEach((step) => {
          Object.keys(step).forEach((padId) => playingPads.add(padId as DrumPadId))
        })
      })
      this.pads.forEach((pad) => {
        result[pad] = {
          label: bankPads[pad]?.name ?? pad.toUpperCase(),
          isTriggered: triggered.has(pad),
          isPlaying: this.isPlaying && playingPads.has(pad)
        }
      })
      return result
    },
    hasZipArtifacts(): boolean {
      return Boolean(this.exportMetadata && this.exportAudioBlob)
    },
    stemEntries(): StemEntry[] {
      if (!this.exportStems) {
        return []
      }
      const bankPads = this.soundbanks.currentBank?.pads ?? {}
      return Object.entries(this.exportStems).map(([padId, entry]) => ({
        padId: padId as DrumPadId,
        label: bankPads[padId as DrumPadId]?.name ?? padId,
        fileName: entry.fileName
      }))
    }
  },
  mounted() {
    const storedPatterns = this.patternStorage.load()
    if (storedPatterns.patterns.length > 0) {
      this.patterns.setPatterns(storedPatterns.patterns)
    }
    if (storedPatterns.scenes.length > 0) {
      this.patterns.setScenes(storedPatterns.scenes)
    }
    if (storedPatterns.selectedPatternId && this.patterns.patterns.find((pattern) => pattern.id === storedPatterns.selectedPatternId)) {
      this.patterns.selectPattern(storedPatterns.selectedPatternId)
    }
    this.patterns.selectScene(storedPatterns.activeSceneId ?? null)
    void this.initializeSoundbank()
    const persistPatterns = () =>
      this.patternStorage.save({
        patterns: this.patterns.patterns,
        scenes: this.patterns.scenes,
        selectedPatternId: this.patterns.selectedPatternId,
        activeSceneId: this.patterns.activeSceneId
      })
    const stopWatch = this.$watch(
      () => [this.patterns.patterns, this.patterns.scenes, this.patterns.selectedPatternId, this.patterns.activeSceneId],
      persistPatterns,
      { deep: true }
    )
    const stopBankPatternWatch = this.$watch(
      () => this.patterns.patterns,
      (value) => {
        const bankId = this.soundbanks.selectedBankId
        if (bankId) {
          void this.soundbankStorage.savePatterns(bankId, value)
        }
      },
      { deep: true }
    )
    const stopMidiListener = this.midi.listen((message) => {
      if (message.type === 'noteon' && typeof message.note === 'number') {
        const pad = this.midi.mapNoteToPad(message.note)
        if (pad) {
          this.handlePad(pad, message.velocity ?? 1)
        }
      }
    })
    this.unwatchers.push(stopWatch)
    this.unwatchers.push(stopBankPatternWatch)
    this.unwatchers.push(() => stopMidiListener?.())
  },
  beforeUnmount() {
    this.unwatchers.forEach((stop) => stop())
  },
  methods: {
    addPattern(payload: { name?: string }) {
      this.patterns.addPattern(payload?.name)
    },
    selectPattern(id: string) {
      this.patterns.selectPattern(id)
    },
    renamePattern(payload: { id: string; name: string }) {
      this.patterns.renamePattern(payload.id, payload.name)
    },
    undoPattern() {
      this.patterns.undo()
    },
    redoPattern() {
      this.patterns.redo()
    },
    addScene(payload: { name?: string; patternIds?: string[] }) {
      this.patterns.addScene(payload?.name ?? 'Scene', payload?.patternIds ?? [])
    },
    updateScene(payload: { id: string; name?: string; patternIds?: string[] }) {
      const updates: Partial<Scene> = {}
      if (typeof payload.name === 'string') {
        updates.name = payload.name
      }
      if (Array.isArray(payload.patternIds)) {
        updates.patternIds = payload.patternIds
      }
      if (Object.keys(updates).length > 0) {
        this.patterns.updateScene(payload.id, updates)
      }
    },
    selectScene(id: string | null) {
      this.patterns.selectScene(id)
    },
    updateFx(settings: FxSettings) {
      this.sequencer.setFx(settings)
    },
    updateBpm(bpm: number) {
      this.transport.setBpm(bpm)
      this.sync.setBpm(bpm)
    },
    start() {
      if (this.transport.isPlaying) return
      this.patterns.prepareScenePlayback()
      this.sequencer.start()
      this.sync.startTransport(this.transport.bpm)
    },
    stop() {
      this.sequencer.stop()
      this.sync.stopTransport()
    },
    handlePad(pad: DrumPadId, velocity = 1) {
      this.sequencer.recordHit(pad, velocity, true)
      this.selectPad(pad)
    },
    selectPad(pad: DrumPadId) {
      this.selectedPadId = pad
    },
    toggleStep(payload: { barIndex: number; stepInBar: number; padId: DrumPadId }) {
      this.patterns.toggleStep(payload.barIndex, payload.stepInBar, payload.padId)
    },
    async requestMidi() {
      await this.midi.requestAccess()
      this.session.setCapabilities({
        supportsAudioInput: this.session.capabilities.supportsAudioInput,
        supportsWebMIDI: this.midi.supportsMidi()
      })
      if (this.midi.inputs.length > 0 && !this.midi.selectedInputId) {
        this.midi.setSelectedInput(this.midi.inputs[0]?.id ?? null)
      }
      if (this.midi.outputs.length > 0 && !this.midi.selectedOutputId) {
        this.midi.setSelectedOutput(this.midi.outputs[0]?.id ?? null)
      }
    },
    selectMidiInput(id: string) {
      this.midi.setSelectedInput(id)
    },
    selectMidiOutput(id: string) {
      this.midi.setSelectedOutput(id)
    },
    mapPadToNote(payload: { padId: DrumPadId; note: number }) {
      if (payload.note >= 0 && payload.note <= 127) {
        this.midi.setPadForNote(payload.note, payload.padId)
      }
    },
    setSyncMode(mode: string) {
      if (mode === 'internal' || mode === 'midiClock' || mode === 'abletonLink') {
        this.sync.setMode(mode)
      }
    },
    setSyncRole(role: string) {
      if (role === 'master' || role === 'slave') {
        this.sync.setRole(role)
      }
    },
    setLoop(loop: boolean) {
      this.transport.setLoop(loop)
    },
    setDivision(division: TimeDivision) {
      const gridSpec = normalizeGridSpec({ ...this.gridSpec, division })
      this.transport.setGridSpec(gridSpec)
      this.patterns.updateGridSpec(gridSpec)
    },
    selectBank(id: string) {
      this.soundbanks.selectBank(id)
      void this.initializeSoundbank()
    },
    inferFormatFromName(name: string): SampleRef['format'] {
      const lower = name.toLowerCase()
      if (lower.endsWith('.wav')) return 'wav'
      if (lower.endsWith('.mp3')) return 'mp3'
      if (lower.endsWith('.ogg')) return 'ogg'
      if (lower.endsWith('.aac')) return 'aac'
      if (lower.endsWith('.flac')) return 'flac'
      return undefined
    },
    async replacePadSample(payload: { padId: DrumPadId; file: File }) {
      const bank = this.soundbanks.currentBank ?? this.defaultBank
      const existing = bank.pads[payload.padId]
      if (existing?.url && existing.url.startsWith('blob:')) {
        URL.revokeObjectURL(existing.url)
      }
      const sampleId = `${payload.padId}-${Date.now()}`
      const format = this.inferFormatFromName(payload.file.name) ?? 'wav'
      const sample: SampleRef = {
        id: sampleId,
        name: payload.file.name,
        format,
        blob: payload.file,
        url: URL.createObjectURL(payload.file)
      }
      const updatedBank: Soundbank = {
        ...bank,
        pads: { ...bank.pads, [payload.padId]: sample },
        updatedAt: Date.now()
      }
      this.soundbanks.upsertBank(updatedBank)
      await this.soundbankStorage.saveBank(updatedBank)
      await this.soundbankStorage.saveSample(sample as SampleRef & { blob: Blob })
      await this.sequencer.setSampleForPad(payload.padId, sample)
      await this.sequencer.applySoundbank(updatedBank)
    },
    async hydrateSamplesForBank(bank: Soundbank): Promise<Soundbank> {
      const hydratedPads: Partial<Record<DrumPadId, SampleRef>> = {}
      const entries = Object.entries(bank.pads)
      for (const [padId, sample] of entries) {
        if (!sample) continue
        let hydrated = sample
        if (!sample.blob) {
          const stored = await this.soundbankStorage.loadSample(sample.id)
          if (stored?.blob) {
            hydrated = { ...sample, blob: stored.blob }
          }
        }
        hydratedPads[padId as DrumPadId] = hydrated
      }
      return { ...bank, pads: hydratedPads }
    },
    async initializeSoundbank() {
      const storedBanks = await this.soundbankStorage.loadBanks()
      if (storedBanks.length > 0) {
        this.soundbanks.setBanks(storedBanks)
      } else if (this.soundbanks.banks.length === 0) {
        this.soundbanks.setBanks([this.defaultBank])
        await this.soundbankStorage.saveBank(this.defaultBank)
      }
      const bank = this.soundbanks.currentBank ?? this.soundbanks.banks[0] ?? this.defaultBank
      const hydratedBank = await this.hydrateSamplesForBank(bank)
      this.soundbanks.upsertBank(hydratedBank)
      const bankPatterns = await this.soundbankStorage.loadPatterns(hydratedBank.id)
      if (bankPatterns.length > 0) {
        this.patterns.setPatterns(bankPatterns)
      }
      await this.sequencer.applySoundbank(hydratedBank)
    },
    getScenePatternChain(): string[] {
      const chain = this.patterns.currentScene?.patternIds ?? []
      const filtered = chain.filter((patternId) => this.patterns.patterns.some((pattern) => pattern.id === patternId))
      if (filtered.length > 0) {
        return filtered
      }
      const fallback = this.patterns.selectedPatternId ?? this.patterns.patterns[0]?.id
      return fallback ? [fallback] : []
    },
    computeExportDuration(): number {
      const bpm = Math.max(1, this.transport.bpm)
      const chain = this.getScenePatternChain()
      const totalBars = chain.reduce((sum, patternId) => {
        const pattern = this.patterns.patterns.find((entry) => entry.id === patternId)
        return sum + (pattern?.gridSpec?.bars ?? DEFAULT_GRID_SPEC.bars)
      }, 0)
      const bars = totalBars || DEFAULT_GRID_SPEC.bars
      return (bars * 4 * 60) / bpm
    },
    async exportBounce() {
      if (this.isExporting) return
      this.isExporting = true
      this.exportError = null
      this.exportStems = null
      try {
        const result = await this.exportAudioFn(this.computeExportDuration())
        this.exportMetadata = result.metadata
        this.exportAudioBlob = result.audioBlob
        this.exportTimeline = result.debugTimeline
        this.exportStems = result.stems ?? null
      } catch (error) {
        console.error('Failed to export audio', error)
        this.exportError = 'Failed to export audio'
        this.exportStems = null
      } finally {
        this.isExporting = false
      }
    },
    downloadStem(pad: DrumPadId) {
      if (this.isExporting) return
      const entry = this.exportStems?.[pad]
      if (!entry) return
      saveAs(entry.blob, entry.fileName)
    },
    downloadMixdown() {
      if (this.isExporting) return
      if (!this.exportAudioBlob) return
      saveAs(this.exportAudioBlob, 'mixdown.wav')
    },
    downloadAllStems() {
      if (this.isExporting || !this.exportStems) return
      Object.values(this.exportStems).forEach((entry) => {
        saveAs(entry.blob, entry.fileName)
      })
    },
    async downloadZip() {
      if (this.isExporting || !this.hasZipArtifacts) return
      try {
        const metadata = this.exportMetadata
        const mixdown = this.exportAudioBlob
        if (!metadata || !mixdown) return
        const metadataBlob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' })
        const files = [
          { name: 'mixdown.wav', blob: mixdown },
          { name: 'render-meta.json', blob: metadataBlob }
        ]
        if (this.exportStems) {
          Object.entries(this.exportStems).forEach(([padId, entry]) => {
            files.push({ name: `stems/${padId}.wav`, blob: entry.blob })
          })
        }
        const entries: ZipEntry[] = await Promise.all(
          files.map(async (file) => ({
            name: file.name,
            data: new Uint8Array(await file.blob.arrayBuffer())
          }))
        )
        const zipped = createZip(entries)
        const songName = slugify(this.soundbanks.currentBank?.name ?? this.patterns.currentScene?.name ?? this.pattern?.name ?? 'drum-session')
        const seedSuffix = metadata.seed ?? Date.now().toString()
        saveAs(zipped, `${songName}_${seedSuffix}.zip`)
      } catch (error) {
        console.error('Failed to create ZIP archive', error)
      }
    }
  }
})
</script>

<style scoped lang="less">
.drumshell {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.hardware-top {
  flex: 0 0 56px;
}

.main-shell {
  flex: 1 1 auto;
  display: flex;
  gap: 16px;
  min-height: 0;
  overflow: hidden;
}

.pads-panel {
  flex: 1 1 65%;
  min-height: 0;
}

.sequencer-panel {
  flex: 0 0 auto;
  height: clamp(72px, 8vh, 96px);
  overflow: hidden;
}

.drawer-wrapper {
  flex: 0 0 auto;
  height: clamp(220px, 28vh, 320px);
  min-height: 56px;
  overflow: hidden;
}
</style>
