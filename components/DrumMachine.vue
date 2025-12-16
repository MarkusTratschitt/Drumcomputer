<template lang="pug">
.section.drum-machine
  v-row
    v-col(cols="12")
      TransportBar(:bpm="bpm" :isPlaying="isPlaying" @play="start" @stop="stop" @bpm:update="updateBpm")
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
import { useTransportStore } from '~/stores/transport'
import { usePatternsStore } from '~/stores/patterns'
import { useSoundbanksStore } from '~/stores/soundbanks'
import { useSessionStore } from '~/stores/session'
import { useSequencer } from '~/composables/useSequencer'
import { useSync } from '~/composables/useSync.client'
import { useMidi } from '~/composables/useMidi.client'
import TransportBar from './TransportBar.vue'
import PadGrid from './PadGrid.vue'
import StepGrid from './StepGrid.vue'
import MidiPanel from './MidiPanel.vue'
import SyncPanel from './SyncPanel.vue'
import SoundbankManager from './SoundbankManager.vue'
import SampleBrowser from './SampleBrowser.vue'
import type { DrumPadId } from '~/types/drums'

export default defineComponent({
  name: 'DrumMachine',
  components: { TransportBar, PadGrid, StepGrid, MidiPanel, SyncPanel, SoundbankManager, SampleBrowser },
  data() {
    const transport = useTransportStore()
    const patterns = usePatternsStore()
    const soundbanks = useSoundbanksStore()
    const session = useSessionStore()

    const sequencer = useSequencer(patterns.currentPattern)
    const sync = useSync('internal')
    const midi = useMidi()

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

    return {
      transport,
      patterns,
      soundbanks,
      session,
      sequencer,
      sync,
      midi,
      pads
    }
  },
  computed: {
    gridSpec() {
      return this.patterns.currentPattern?.gridSpec ?? { bars: 1, division: 16 }
    },
    pattern() {
      return this.patterns.currentPattern ?? { id: 'pattern-1', name: 'Pattern 1', gridSpec: { bars: 1, division: 16 }, steps: {} }
    },
    currentStep() {
      return this.sequencer?.state?.value?.currentStep ?? 0
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
      this.transport.setPlaying(true)
      this.sequencer.setPlaying(true)
    },
    stop() {
      this.transport.setPlaying(false)
      this.sequencer.setPlaying(false)
    },
    handlePad(pad: DrumPadId) {
      void pad
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
    }
  }
})
</script>
