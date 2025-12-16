<template lang="pug">
.section.drum-machine
  v-row
    v-col(cols="12")
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
  v-row
    v-col(cols="6")
      PadGrid(:pads="pads" @pad:down="handlePad")
    v-col(cols="6")
      StepGrid(:gridSpec="gridSpec" :steps="pattern.steps" :currentStep="currentStep" @step:toggle="toggleStep")
  v-row
    v-col(cols="12" md="6")
      MidiPanel(:devices="midiInputs" :supports="capabilities.supportsWebMIDI" @request="requestMidi")
    v-col(cols="12" md="6")
      SyncPanel(:syncState="syncState" @mode="setSyncMode" @role="setSyncRole")
  v-row
    v-col(cols="12" md="6")
      SoundbankManager(:banks="banks")
    v-col(cols="12" md="6")
      SampleBrowser
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { DEFAULT_GRID_SPEC, GRID_DIVISIONS, normalizeGridSpec } from '~/domain/timing'
import { useTransportStore } from '~/stores/transport'
import { usePatternsStore } from '~/stores/patterns'
import { useSoundbanksStore } from '~/stores/soundbanks'
import { useSessionStore } from '~/stores/session'
import { useSequencer } from '~/composables/useSequencer'
import { useSync } from '~/composables/useSync.client'
import { useMidi } from '~/composables/useMidi.client'
import { usePatternStorage } from '~/composables/usePatternStorage.client'
import TransportBar from './TransportBar.vue'
import PadGrid from './PadGrid.vue'
import StepGrid from './StepGrid.vue'
import MidiPanel from './MidiPanel.vue'
import SyncPanel from './SyncPanel.vue'
import SoundbankManager from './SoundbankManager.vue'
import SampleBrowser from './SampleBrowser.vue'
import type { DrumPadId } from '~/types/drums'
import type { TimeDivision } from '~/types/time'
import type { Soundbank } from '~/types/audio'

export default defineComponent({
  name: 'DrumMachine',
  components: { TransportBar, PadGrid, StepGrid, MidiPanel, SyncPanel, SoundbankManager, SampleBrowser },
  data() {
    const transport = useTransportStore()
    const patterns = usePatternsStore()
    const soundbanks = useSoundbanksStore()
    const session = useSessionStore()

    const sequencer = useSequencer({
      getPattern: () => patterns.currentPattern
    })
    const sync = useSync('internal')
    const midi = useMidi()
    const patternStorage = usePatternStorage()

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
    const divisions: TimeDivision[] = [...GRID_DIVISIONS]
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

    return {
      transport,
      patterns,
      soundbanks,
      session,
      sequencer,
      sync,
      midi,
      patternStorage,
      pads,
      divisions,
      defaultBank,
      unwatchers: [] as Array<() => void>
    }
  },
  mounted() {
    const storedPatterns = this.patternStorage.load()
    if (storedPatterns.length > 0) {
      this.patterns.setPatterns(storedPatterns)
    }
    void this.initializeSoundbank()
    const stopWatch = this.$watch(
      () => this.patterns.patterns,
      (value) => this.patternStorage.save(value),
      { deep: true }
    )
    this.unwatchers.push(stopWatch)
  },
  beforeUnmount() {
    this.unwatchers.forEach((stop) => stop())
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
    banks() {
      return this.soundbanks.banks
    },
    syncState() {
      return this.sync.state
    },
    capabilities() {
      return this.session.capabilities
    }
  },
  methods: {
    updateBpm(bpm: number) {
      this.transport.setBpm(bpm)
      this.sync.setBpm(bpm)
    },
    start() {
      if (this.transport.isPlaying) return
      this.sequencer.start()
    },
    stop() {
      this.sequencer.stop()
    },
    handlePad(pad: DrumPadId) {
      this.sequencer.recordHit(pad, 1, true)
    },
    toggleStep(payload: { barIndex: number; stepInBar: number; padId: DrumPadId }) {
      this.patterns.toggleStep(payload.barIndex, payload.stepInBar, payload.padId)
    },
    async requestMidi() {
      await this.midi.requestAccess()
      this.session.setCapabilities({ supportsAudioInput: false, supportsWebMIDI: this.midi.supportsMidi() })
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
    async initializeSoundbank() {
      if (this.soundbanks.banks.length === 0) {
        this.soundbanks.setBanks([this.defaultBank])
      }
      const bank = this.soundbanks.currentBank ?? this.defaultBank
      await this.sequencer.applySoundbank(bank)
    }
  }
})
</script>
