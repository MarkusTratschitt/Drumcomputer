<template>
  <div class="hardware-stage">
    <div class="device-hardware" aria-label="Maschine MK3 layout placeholder">
      <div class="top-row">
        <div class="top-left">
          <SoftButtonStripPlaceholder />
          <DualDisplayPlaceholder />
          <ScreenKnobRingPlaceholder />
        </div>
        <div class="top-right">
          <FourDEncoderPlaceholder />
        </div>
      </div>

      <div class="bottom-row">
        <div class="left-column">
          <ModeColumnPlaceholder />

          <div class="transport-cluster" title="Transport cluster (MK3-style)">
            <slot name="transport" :props="transportSlotProps" />
          </div>

          <div class="drawer-shell" title="Drawer panels (Sound / FX / Patterns / Export)">
            <slot name="drawer" :props="drawerSlotProps" />
          </div>
        </div>

        <div class="right-column">
          <div class="pads-and-strip">
            <TouchStripPlaceholder />
            <div class="pads-stack" title="Pad grid with bank indicators">
              <div class="pads-square">
                <slot name="pads" :props="padsSlotProps" />
              </div>
              <div class="pad-grid-indicator">
                <span
                  v-for="i in gridCount"
                  :key="i"
                  :class="['indicator-dot', { active: currentGridIndex === i - 1 }]"
                  :aria-label="`Pad Bank ${i}`"
                  :title="`Pad Bank ${i}`"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>




<script lang="ts">
import { defineComponent } from 'vue'
import { saveAs } from 'file-saver'
import { DEFAULT_GRID_SPEC, GRID_DIVISIONS, normalizeGridSpec } from '@/domain/timing'
// Hosts the drum machine hardware layout and wires transport, pads, drawer panels, persistence, MIDI, sync, and export flows.
import { useTransportStore } from '@/stores/transport'
import { usePatternsStore } from '@/stores/patterns'
import { useSoundbanksStore } from '@/stores/soundbanks'
import { useSessionStore } from '@/stores/session'
import { useSequencer } from '@/composables/useSequencer'
import { useSync } from '@/composables/useSync.client'
import { useMidi } from '@/composables/useMidi.client'
import { usePatternStorage } from '@/composables/usePatternStorage.client'
import { useSoundbankStorage } from '@/composables/useSoundbankStorage.client'
import { useImportExport } from '@/composables/useImportExport.client'
import { useCapabilities } from '@/composables/useCapabilities.client'
import { useMidiLearn } from '@/composables/useMidiLearn'
import TransportBar from './TransportBar.vue'
import PadGrid from './PadGrid.vue'
import TabPanel from './TabPanel.vue'
import SoundPanel from './panels/SoundPanel.vue'
import FxPanel from './panels/FxPanel.vue'
import PatternsPanel from './panels/PatternsPanel.vue'
import ExportPanel from './panels/ExportPanel.vue'
import { createZip, type ZipEntry } from '@/utils/zip'
import type { DrumPadId, Scene } from '@/types/drums'
import type { TimeDivision } from '@/types/time'
import type { FxSettings, SampleRef, Soundbank } from '@/types/audio'
import type { RenderEvent, RenderMetadata } from '@/types/render'
import type { StepGrid } from '@/types/drums'
import DualDisplayPlaceholder from './placeholders/DualDisplayPlaceholder.vue'
import SoftButtonStripPlaceholder from './placeholders/SoftButtonStripPlaceholder.vue'
import ScreenKnobRingPlaceholder from './placeholders/ScreenKnobRingPlaceholder.vue'
import FourDEncoderPlaceholder from './placeholders/FourDEncoderPlaceholder.vue'
import ModeColumnPlaceholder from './placeholders/ModeColumnPlaceholder.vue'
import TouchStripPlaceholder from './placeholders/TouchStripPlaceholder.vue'

const slugify = (value: string): string => {
  const cleaned = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
  return cleaned || 'drum-session'
}

type StemFiles = Partial<
  Record<
    DrumPadId,
    {
      fileName: string
      blob: Blob
    }
  >
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

const collectPlayingPads = (steps: StepGrid): Set<DrumPadId> => {
  const set = new Set<DrumPadId>()

  Object.values(steps).forEach((bar) => {
    Object.values(bar).forEach((step) => {
      Object.keys(step).forEach((padId) => {
        set.add(padId as DrumPadId)
      })
    })
  })

  return set
}

export default defineComponent({
  name: 'DrumMachine',
  components: {
    TransportBar,
    PadGrid,
    TabPanel,
    SoundPanel,
    FxPanel,
    PatternsPanel,
    ExportPanel,
    DualDisplayPlaceholder,
    SoftButtonStripPlaceholder,
    ScreenKnobRingPlaceholder,
    FourDEncoderPlaceholder,
    ModeColumnPlaceholder,
    TouchStripPlaceholder
  },
  data() {
    const transport = useTransportStore()
    const patterns = usePatternsStore()
    const soundbanks = useSoundbanksStore()
    const session = useSessionStore()
    const capabilitiesProbe = useCapabilities()
    session.setCapabilities(capabilitiesProbe.capabilities.value)

    const importExport = useImportExport()
    const midi = useMidi()
    const midiLearn = useMidiLearn(midi)
    const sequencer = useSequencer({
      getPattern: () => patterns.currentPattern,
      onPatternBoundary: () => patterns.advanceScenePlayback()
    })
    const handleExternalStart = () => {
      if (!transport.isPlaying) {
        patterns.prepareScenePlayback()
        void sequencer.start().catch((error) => {
          console.error('Failed to start sequencer from external sync', error)
        })
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
      midiLearn,
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
      currentGridIndex: 0,
      padsPerGrid: 16,
      drawerTab: 'sound',
      countInTimer: null as number | null,
      tapTimestamps: [] as number[],
      liveEraseEnabled: false,
      presetBars: patterns.currentPattern?.gridSpec?.bars ?? DEFAULT_GRID_SPEC.bars,
      presetDivision: patterns.currentPattern?.gridSpec?.division ?? DEFAULT_GRID_SPEC.division,
      channelTarget: 'sound' as 'sound' | 'group' | 'master',
      midiMode: false
    }
  },


computed: {
  gridSpec() {
    return this.patterns.currentPattern?.gridSpec ?? { ...DEFAULT_GRID_SPEC }
  },

  gridCount(): number {
    return Math.ceil(this.pads.length / this.padsPerGrid)
  },

  activePadGrid(): DrumPadId[] {
    const start = this.currentGridIndex * this.padsPerGrid
    return this.pads.slice(start, start + this.padsPerGrid)
  },

  pattern() {
    return (
      this.patterns.currentPattern ?? {
        id: 'pattern-1',
        name: 'Pattern 1',
        gridSpec: { ...DEFAULT_GRID_SPEC },
        steps: {}
      }
    )
  },

  currentStep() {
    return this.transport.currentStep
  },

  totalSteps(): number {
    return Math.max(1, this.gridSpec.bars * this.gridSpec.division)
  },

  patternChainEntries() {
    const chain = this.patterns.currentScene?.patternIds ?? []
    if (!Array.isArray(chain) || chain.length === 0) {
      return null
    }
    return chain
      .map((patternId) => {
        const entry = this.patterns.patterns.find((pattern) => pattern.id === patternId)
        if (!entry) return null
        return { id: patternId, bars: entry.gridSpec?.bars ?? this.gridSpec.bars }
      })
      .filter(Boolean) as Array<{ id: string; bars: number }> | null
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

  stemEntries(): StemEntry[] {
    if (!this.exportStems) return []
    const bankPads = this.soundbanks.currentBank?.pads ?? {}

    return Object.entries(this.exportStems).map(([padId, entry]) => ({
      padId: padId as DrumPadId,
      label: bankPads[padId as DrumPadId]?.name ?? padId,
      fileName: entry.fileName
    }))
  },

  syncState() {
    return this.sync.state
  },

  capabilities() {
    return this.session.capabilities
  }, 

  hasZipArtifacts(): boolean {
    return Boolean(this.exportMetadata && this.exportAudioBlob)
  },
  
  midiLearnLabel(): string {
    return (
      this.midiLearn.learningLabel ??
      this.midiLearn.status ??
      'Listening for MIDI...'
    )
  },
  
  padStates() {
    const bankPads = this.soundbanks.currentBank?.pads ?? {}
    const result = {} as Record<DrumPadId, PadState>

    const stepsPerPattern = Math.max(
      1,
      this.gridSpec.bars * this.gridSpec.division
    )

    const normalizedStep =
      ((this.currentStep % stepsPerPattern) + stepsPerPattern) %
      stepsPerPattern

    const barIndex = Math.floor(normalizedStep / this.gridSpec.division)
    const stepIndex = normalizedStep % this.gridSpec.division

    const currentRow =
      this.pattern.steps[barIndex]?.[stepIndex] ?? {}

    const triggered = new Set<DrumPadId>(
      Object.keys(currentRow) as DrumPadId[]
    )

    const playingPads = collectPlayingPads(this.pattern.steps)
    const visiblePads = this.activePadGrid
    visiblePads.forEach((pad) => {
      result[pad] = {
        label: bankPads[pad]?.name ?? pad.toUpperCase(),
        isTriggered: triggered.has(pad),
        isPlaying: this.isPlaying && playingPads.has(pad)
      }
    })

    return result
  },

  mainSlotProps() {
    return {
      stepGridProps: {
        gridSpec: this.gridSpec,
        steps: this.pattern.steps,
        patternChain: this.patternChainEntries,
        selectedPad: this.selectedPadId as DrumPadId | null,
        currentStep: this.currentStep,
        isPlaying: this.isPlaying,
        followEnabled: this.transport.followEnabled,
        loopStart: this.transport.loopStart,
        loopEnd: this.transport.loopEnd,
        'onStep:toggle': this.toggleStep,
        'onPlayhead:scrub': this.scrubPlayhead,
        'onStep:velocity': this.updateStepVelocity
      }
    }
  },
  

  transportSlotProps() {
    return {
      transportProps: {
        bpm: this.bpm,
        isPlaying: this.isPlaying,
        loop: this.transport.loop,
        division: this.gridSpec.division,
        divisions: this.divisions,
        isMidiLearning: this.midiLearn.isLearning,
        isRecording: this.transport.isRecording,
        countInEnabled: this.transport.countInEnabled,
        countInBars: this.transport.countInBars,
        metronomeEnabled: this.transport.metronomeEnabled,
        followEnabled: this.transport.followEnabled,
        patternBars: this.gridSpec.bars,
        loopStart: this.transport.loopStart,
        loopEnd: this.transport.loopEnd,
        totalSteps: this.totalSteps,
        selectedPad: this.selectedPadId,
        liveEraseEnabled: this.liveEraseEnabled,
        metronomeVolume: this.transport.metronomeVolume,
        presetBars: this.presetBars,
        presetDivision: this.presetDivision
        ,
        onPlay: this.start,
        onStop: this.stop,
        onStopReset: this.resetPlayhead,
        onRestart: this.restartLoop,
        onToggleRecord: this.toggleRecord,
        onToggleCountIn: this.toggleCountIn,
        onUpdateCountInBars: this.setCountInBars,
        onTapTempo: this.tapTempo,
        onToggleMetronome: this.toggleMetronome,
        onToggleFollow: this.toggleFollow,
        onUpdatePatternBars: this.setPatternBars,
        onNudgeLoopRange: this.nudgeLoopRange,
        onUpdateLoopStart: this.updateLoopStart,
        onUpdateLoopEnd: this.updateLoopEnd,
        'onUpdate:metronomeVolume': this.setMetronomeVolume,
        onToggleLiveErase: this.toggleLiveErase,
        onErasePad: this.eraseSelectedPad,
        onEraseCurrentStep: this.eraseSelectedPadAtCurrentStep,
        'onUpdate:presetBars': this.setPresetBars,
        'onUpdate:presetDivision': this.setPresetDivision,
        onApplyPatternPreset: this.applyPatternPreset,
        onUpdateBpm: this.updateBpm,
        onIncrementBpm: this.incrementBpm,
        onDecrementBpm: this.decrementBpm,
        onUpdateDivision: this.setDivision,
        onUpdateLoop: this.setLoop,
        onToggleMidiLearn: this.toggleMidiLearn
      },
      transportListeners: {
        play: this.start,
        stop: this.stop,
        'stop-reset': this.resetPlayhead,
        restart: this.restartLoop,
        'toggle-record': this.toggleRecord,
        'toggle-count-in': this.toggleCountIn,
        'update-count-in-bars': this.setCountInBars,
        'tap-tempo': this.tapTempo,
        'toggle-metronome': this.toggleMetronome,
        'toggle-follow': this.toggleFollow,
        'update-pattern-bars': this.setPatternBars,
        'nudge-loop-range': this.nudgeLoopRange,
        'update-loop-start': this.updateLoopStart,
        'update-loop-end': this.updateLoopEnd,
        'update:metronome-volume': this.setMetronomeVolume,
        'toggle-live-erase': this.toggleLiveErase,
        'erase-pad': this.eraseSelectedPad,
        'erase-current-step': this.eraseSelectedPadAtCurrentStep,
        'update:preset-bars': this.setPresetBars,
        'update:preset-division': this.setPresetDivision,
        'apply-pattern-preset': this.applyPatternPreset,
        'update-bpm': this.updateBpm,
        'increment-bpm': this.incrementBpm,
        'decrement-bpm': this.decrementBpm,
        'update-division': this.setDivision,
        'update-loop': this.setLoop,
        'toggle-midi-learn': this.toggleMidiLearn
      },
      midiLearnLabel: this.midiLearnLabel
    }
  },

  padsSlotProps() {
    return {
      padGridProps: {
        pads: this.activePadGrid,
        padStates: this.padStates,
        selectedPad: this.selectedPadId as DrumPadId | null,
        'onPad:down': this.handlePad,
        'onPad:select': this.selectPad
      }
    }
  },

  drawerSlotProps() {
    return {
      drawerTab: this.drawerTab,
      onUpdateDrawerTab: (value: string) => {
        this.drawerTab = value
      },
      soundProps: {
        banks: this.banks,
        selectedBankId: this.soundbanks.selectedBankId,
        'onBank:select': this.selectBank,
        'onPad:replace': this.replacePadSample
      },
      fxProps: {
        fxSettings: (this.sequencer.fxSettings ?? {}) as FxSettings,
        'onFx:update': this.updateFx
      },
      patternsProps: {
        patterns: this.patterns.patterns,
        selectedPatternId: this.patterns.selectedPatternId,
        scenes: this.patterns.scenes,
        activeSceneId: this.patterns.activeSceneId,
        'onPattern:add': this.addPattern,
        'onPattern:select': this.selectPattern,
        'onPattern:rename': this.renamePattern,
        'onPattern:undo': this.undoPattern,
        'onPattern:redo': this.redoPattern,
        'onScene:add': this.addScene,
        'onScene:update': this.updateScene,
        'onScene:select': this.selectScene,
        'onErase:pad': this.eraseSelectedPad,
        'onErase:step': this.eraseSelectedPadAtCurrentStep
      },
      exportProps: {
        isExporting: this.isExporting,
        exportError: this.exportError,
        exportMetadata: this.exportMetadata,
        audioBlob: this.exportAudioBlob,
        hasZipArtifacts: this.hasZipArtifacts,
        stemEntries: this.stemEntries,
        onExport: this.exportBounce,
        'onDownload:mixdown': this.downloadMixdown,
        'onDownload:zip': this.downloadZip,
        'onDownload:stem': this.downloadStem,
        'onDownload:stems': this.downloadAllStems
      },
      channelProps: {
        controlTarget: this.channelTarget,
        midiMode: this.midiMode,
        'onUpdate:control-target': (value: string) => {
          this.channelTarget = value as 'sound' | 'group' | 'master'
        },
        'onUpdate:midi-mode': (value: boolean) => {
          this.midiMode = Boolean(value)
        }
      }
    }
  }
},


  mounted() {
    window.addEventListener('keydown', this.handleGridKeys)
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
      if (this.midiLearn.handleMessage(message)) {
        return
      }

      if (message.type === 'noteon' && typeof message.note === 'number') {
        const transportMap = this.midi.mapping?.transportMap
        const transportNote = transportMap?.play === message.note
          ? 'play'
          : transportMap?.stop === message.note
            ? 'stop'
            : transportMap?.bpmUp === message.note
              ? 'bpmUp'
              : transportMap?.bpmDown === message.note
                ? 'bpmDown'
                : null

        if (transportNote === 'play') {
          void this.start()
          return
        }
        if (transportNote === 'stop') {
          this.stop()
          return
        }
        if (transportNote === 'bpmUp') {
          this.updateBpm(this.bpm + 1)
          return
        }
        if (transportNote === 'bpmDown') {
          this.updateBpm(this.bpm - 1)
          return
        }

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
    window.removeEventListener('keydown', this.handleGridKeys)
    this.clearCountInTimer()
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
    async start() {
      if (this.transport.isPlaying) return
      if (this.midiLearn.isLearning) {
        this.midiLearn.setTarget({ type: 'transport', action: 'play' })
      }
      this.patterns.prepareScenePlayback()
      await this.sequencer.start()
      this.sync.startTransport(this.transport.bpm)
    },
    stop() {
      if (!this.transport.isPlaying) {
        this.resetPlayhead()
        this.transport.setRecording(false)
        return
      }
      if (this.midiLearn.isLearning) {
        this.midiLearn.setTarget({ type: 'transport', action: 'stop' })
      }
      this.sequencer.stop()
      this.sync.stopTransport()
      this.transport.setRecording(false)
    },
    resetPlayhead() {
      this.transport.setCurrentStep(0)
    },
    restartLoop() {
      if (this.transport.isPlaying) {
        this.sequencer.stop()
        this.transport.setCurrentStep(this.transport.loopStart)
        this.patterns.prepareScenePlayback()
        void this.sequencer.start()
      } else {
        this.transport.setCurrentStep(this.transport.loopStart)
      }
    },
    toggleRecord() {
      const next = !this.transport.isRecording
      this.transport.setRecording(next)
      if (!next) {
        this.clearCountInTimer()
        return
      }
      if (!this.transport.isPlaying) {
        if (this.transport.countInEnabled) {
          this.startWithCountIn()
        } else {
          void this.start()
        }
      }
    },
    startWithCountIn() {
      this.clearCountInTimer()
      const bars = Math.max(1, this.transport.countInBars)
      const delayMs = (bars * 4 * 60 * 1000) / Math.max(1, this.bpm)
      this.countInTimer = window.setTimeout(() => {
        void this.start()
        this.transport.setRecording(true)
        this.clearCountInTimer()
      }, delayMs)
    },
    clearCountInTimer() {
      if (this.countInTimer != null) {
        window.clearTimeout(this.countInTimer)
        this.countInTimer = null
      }
    },
    toggleCountIn() {
      this.transport.setCountInEnabled(!this.transport.countInEnabled)
      if (!this.transport.countInEnabled) {
        this.clearCountInTimer()
      }
    },
    setCountInBars(value: number) {
      this.transport.setCountInBars(value ?? 1)
    },
    tapTempo() {
      const now = Date.now()
      this.tapTimestamps.push(now)
      const recent = this.tapTimestamps.slice(-4)
      this.tapTimestamps = recent
      if (recent.length < 2) return
      const intervals = []
      for (let i = 1; i < recent.length; i += 1) {
        intervals.push(recent[i] - recent[i - 1])
      }
      const avgMs = intervals.reduce((sum, val) => sum + val, 0) / intervals.length
      const bpm = Math.max(1, Math.round(60000 / avgMs))
      this.updateBpm(bpm)
    },
    toggleMetronome() {
      this.transport.setMetronomeEnabled(!this.transport.metronomeEnabled)
    },
    toggleFollow() {
      this.transport.setFollowEnabled(!this.transport.followEnabled)
    },
    setPatternBars(bars: number) {
      const normalized = Math.max(1, Math.floor(bars))
      const gridSpec = normalizeGridSpec({ ...this.gridSpec, bars: normalized })
      this.transport.setGridSpec(gridSpec)
      this.patterns.updateGridSpec(gridSpec)
      const total = gridSpec.bars * gridSpec.division
      this.transport.setLoopRange(0, total)
      this.resetPlayhead()
    },
    nudgeLoopRange(delta: number) {
      this.transport.nudgeLoopRange(delta)
      const clamped = Math.min(Math.max(this.transport.currentStep, this.transport.loopStart), this.transport.loopEnd - 1)
      this.transport.setCurrentStep(clamped)
    },
    updateLoopStart(value: number) {
      const nextStart = Math.max(0, Math.floor(value))
      const end = Math.max(nextStart + 1, this.transport.loopEnd)
      this.transport.setLoopRange(nextStart, end)
      const clamped = Math.min(Math.max(this.transport.currentStep, nextStart), end - 1)
      this.transport.setCurrentStep(clamped)
    },
    updateLoopEnd(value: number) {
      const total = this.totalSteps
      const nextEnd = Math.min(total, Math.max(1, Math.floor(value)))
      const start = Math.min(this.transport.loopStart, nextEnd - 1)
      this.transport.setLoopRange(start, nextEnd)
      const clamped = Math.min(Math.max(this.transport.currentStep, start), nextEnd - 1)
      this.transport.setCurrentStep(clamped)
    },
    setMetronomeVolume(value: number) {
      this.transport.setMetronomeVolume(value ?? 0.12)
    },
    setPresetBars(value: number) {
      const bars = Math.max(1, Math.floor(value ?? 1))
      this.presetBars = bars
    },
    setPresetDivision(value: TimeDivision | null) {
      if (value != null) {
        this.presetDivision = value
      }
    },
    applyPatternPreset() {
      const gridSpec = normalizeGridSpec({
        ...this.gridSpec,
        bars: this.presetBars,
        division: this.presetDivision
      })
      this.transport.setGridSpec(gridSpec)
      this.patterns.updateGridSpec(gridSpec)
      this.transport.setLoopRange(0, gridSpec.bars * gridSpec.division)
      this.resetPlayhead()
    },
    handleGridKeys(e: KeyboardEvent) {
      if (e.ctrlKey && !e.shiftKey) {
        const index = Number(e.key) - 1
        if (index >= 0 && index < this.gridCount) {
          e.preventDefault()
          this.selectPadGrid(index)
          return
        }
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          this.redoPattern()
        } else {
          this.undoPattern()
        }
      }
    },
    async handlePad(pad: DrumPadId, velocity = 1) {
      if (this.liveEraseEnabled) {
        this.erasePadAtStep(pad, this.transport.currentStep)
        return
      }
      try {
        await this.sequencer.recordHit(pad, velocity, true)
      } catch (error) {
        console.error('Failed to trigger pad', error)
      }
      this.selectPad(pad)
    },
    selectPad(pad: DrumPadId) {
      this.selectedPadId = pad
      if (this.midiLearn.isLearning) {
        this.midiLearn.setTarget({ type: 'pad', padId: pad })
      }
    },
    selectPadGrid(index: number) {
      if (index < 0 || index >= this.gridCount) return
      this.currentGridIndex = index
      const firstPad = this.activePadGrid[0]
      if (firstPad) {
        this.selectedPadId = firstPad
      }
    },
    toggleStep(payload: { barIndex: number; stepInBar: number; padId: DrumPadId }) {
      this.patterns.toggleStep(payload.barIndex, payload.stepInBar, payload.padId)
    },
    updateStepVelocity(payload: {
      barIndex: number
      stepInBar: number
      padId: DrumPadId
      velocity: number
    }) {
      this.patterns.setStepVelocity(
        payload.barIndex,
        payload.stepInBar,
        payload.padId,
        payload.velocity
      )
    },
    scrubPlayhead(payload: { stepIndex: number }) {
      this.transport.setCurrentStep(payload.stepIndex)
    },
    erasePadAtStep(pad: DrumPadId, stepIndex: number) {
      const stepsPerPattern = this.totalSteps
      const normalizedStep =
        ((stepIndex % stepsPerPattern) + stepsPerPattern) % stepsPerPattern
      const barIndex = Math.floor(normalizedStep / this.gridSpec.division)
      const stepInBar = normalizedStep % this.gridSpec.division
      this.patterns.eraseStepForPad(barIndex, stepInBar, pad)
    },
    eraseSelectedPad() {
      if (!this.selectedPadId) return
      this.patterns.erasePadEvents(this.selectedPadId)
    },
    eraseSelectedPadAtCurrentStep() {
      if (!this.selectedPadId) return
      this.erasePadAtStep(this.selectedPadId, this.transport.currentStep)
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
    incrementBpm() {
      if (this.midiLearn.isLearning) {
        this.midiLearn.setTarget({ type: 'transport', action: 'bpmUp' })
      }
      this.updateBpm(this.bpm + 1)
    },
    decrementBpm() {
      if (this.midiLearn.isLearning) {
        this.midiLearn.setTarget({ type: 'transport', action: 'bpmDown' })
      }
      this.updateBpm(this.bpm - 1)
    },
    toggleMidiLearn() {
      if (this.midiLearn.isLearning) {
        this.midiLearn.disable()
      } else {
        this.midiLearn.enable()
      }
    },
    toggleLiveErase() {
      this.liveEraseEnabled = !this.liveEraseEnabled
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
@import '@/styles/variables.less';

.device-root {
  height: 100%;
  width: 100%;
  overflow: hidden;
  background: @color-bg-root;
}

.device-stage {
  height: 100%;
  min-height: 0;

  display: grid;
  grid-template-columns: 1fr clamp(520px, 36vw, 760px);
  gap: @space-m;
  padding: @space-m;
}

.device-main {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  background: @color-surface-1;
  border: 1px solid @color-border-1;
  border-radius: @radius-l;
}

.hardware-stage {
  --stage-pad: clamp(12px, 1.6vw, 24px);
  height: 100svh;
  min-height: 100svh;
  width: 100%;
  padding: var(--stage-pad);
  box-sizing: border-box;
  overflow: hidden;
  background: radial-gradient(130% 130% at 25% 20%, #2c313c 0%, #1a1e26 50%, #0d0f14 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.device-hardware {
  position: relative;
  --device-w: 100%;
  --device-gap: clamp(8px, 1.2vh, 16px);
  --panel-radius: @radius-l;
  aspect-ratio: 1080 / 760;
  max-width: calc(100vw - (2 * var(--stage-pad)));
  max-height: calc(100svh - (2 * var(--stage-pad)));
  width: min(
    calc(100vw - (2 * var(--stage-pad))),
    calc((100svh - (2 * var(--stage-pad))) * (1080 / 760))
  );
  height: auto;
  margin: 0 auto;
  display: grid;
  grid-template-rows: auto 1fr;
  gap: var(--device-gap);
  background: linear-gradient(180deg, #1f232c, #151821);
  border: 1px solid fade(#3b4355, 70%);
  border-radius: var(--panel-radius);
  padding: @space-m;
  box-sizing: border-box;
  overflow: hidden;
  box-shadow:
    0 30px 62px rgba(0, 0, 0, 0.6),
    0 2px 12px rgba(0, 0, 0, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.08),
    inset 0 -1px 0 rgba(0, 0, 0, 0.8);
}

.top-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) clamp(180px, 20%, 260px);
  gap: @space-l;
  align-items: stretch;
  min-height: 0;
}

.top-left {
  display: flex;
  flex-direction: column;
  gap: @space-xs;
  min-width: 0;
}

.top-right {
  display: flex;
  align-items: stretch;
  justify-content: flex-end;
}

.bottom-row {
  display: grid;
  grid-template-columns: clamp(220px, 24%, 320px) minmax(0, 1fr);
  gap: @space-m;
  min-height: 0;
}

.left-column {
  display: flex;
  flex-direction: column;
  gap: @space-s;
  min-height: 0;
}

.transport-cluster {
  background: linear-gradient(180deg, #1f2531, #141924);
  border: 1px solid fade(#3b4355, 65%);
  border-radius: @radius-m;
  padding: @space-s;
  min-height: 0;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.drawer-shell {
  flex: 1 1 auto;
  min-height: 0;
  max-height: clamp(260px, 36vh, 360px);
  overflow: auto;
  background: linear-gradient(180deg, #1c202b, #10141d);
  border: 1px solid fade(#3b4355, 65%);
  border-radius: @radius-m;
  padding: @space-s;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.right-column {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: @space-m;
  min-height: 0;
}

.pads-and-strip {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: @space-m;
  align-items: end;
  min-height: 0;
}

.pads-stack {
  display: flex;
  flex-direction: column;
  gap: @space-xs;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
  min-width: 0;
  min-height: 0;
  background: linear-gradient(180deg, #191d27, #10141d);
  border: 1px solid fade(#3b4355, 60%);
  border-radius: @radius-m;
  padding: @space-s;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

.pads-square {
  width: 100%;
  max-width: clamp(520px, 62%, 760px);
  aspect-ratio: 1 / 1;
  min-height: 0;
  display: flex;
}

.pads-square > * {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
}

.device-hardware.debug-overlay::before {
  content: '';
  position: absolute;
  inset: 0;
  background: url('/img/maschine-reference.png') center / contain no-repeat;
  opacity: 0.35;
  pointer-events: none;
}

.device-hardware.debug-grid::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(to right, rgba(255, 255, 255, 0.15) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.15) 1px, transparent 1px);
  background-size: 20px 20px;
  opacity: 0.15;
  pointer-events: none;
}

.pad-grid-indicator {
  display: flex;
  justify-content: center;
  gap: @space-xs;
  padding: @space-xxs;
  background: rgba(255, 255, 255, 0.02);
  border-radius: @radius-s;
}

.indicator-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #1f2734;
  box-shadow: inset 0 0 4px rgba(0,0,0,0.9);
}

.indicator-dot.active {
  background: #f68b1e;
  box-shadow:
    0 0 6px fade(#f68b1e, 60%),
    0 0 12px fade(#f68b1e, 35%);
}

@media (max-width: 1200px) {
  .bottom-row {
    grid-template-columns: 320px 1fr;
  }

  .pads-square {
    width: clamp(360px, 48vw, 520px);
  }
}

@media (max-width: 960px) {
  .device-hardware {
    grid-template-rows: auto auto 1fr;
  }

  .top-row {
    grid-template-columns: 1fr;
  }

  .bottom-row {
    grid-template-columns: 1fr;
  }

  .right-column {
    grid-template-columns: 1fr;
  }

  .pads-and-strip {
    grid-template-columns: 1fr;
    justify-items: center;
  }

  .drawer-shell {
    max-height: 45vh;
  }
}

</style>
