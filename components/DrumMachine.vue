<template>
    <div class="hardware-stage">
      <div class="device-hardware" aria-label="Maschine MK3 layout placeholder">
        <div class="top-row">
          <div class="control-stack">
            <div class="control-area">
              <div class="control-fixed" aria-label="Fixed control buttons">
                <div class="control-btn-grid" aria-label="Control buttons">
                  <button
                    class="control-btn r1 c1"
                    type="button"
                    :class="{ active: isActiveMode('CHANNEL') }"
                    :title="modeTooltip('CHANNEL', 'CHANNEL', 'MIDI')"
                    :aria-label="modeTooltip('CHANNEL', 'CHANNEL', 'MIDI')"
                    @click="handleModePress('CHANNEL', 'CHANNEL_MIDI')"
                  >
                    <span class="control-btn__main">CHANNEL</span>
                    <span class="control-btn__sub">MIDI</span>
                  </button>

                  <button
                    class="control-btn r1 c2"
                    type="button"
                    :class="{ active: isActiveMode('PLUGIN') }"
                    :title="modeTooltip('PLUGIN', 'PLUG-IN', 'Instance')"
                    :aria-label="modeTooltip('PLUGIN', 'PLUG-IN', 'Instance')"
                    @click="handleModePress('PLUGIN', 'PLUGIN_INSTANCE')"
                  >
                    <span class="control-btn__main">PLUG-IN</span>
                    <span class="control-btn__sub">Instance</span>
                  </button>

                  <button
                    class="control-btn r2 c1"
                    type="button"
                    :class="{ active: isActiveMode('ARRANGER') }"
                    :title="modeTooltip('ARRANGER', 'ARRANGER')"
                    :aria-label="modeTooltip('ARRANGER', 'ARRANGER')"
                    @click="handleModePress('ARRANGER')"
                  >
                    <span class="control-btn__main">ARRANGER</span>
                  </button>

                  <button
                    class="control-btn r2 c2"
                    type="button"
                    :class="{ active: isActiveMode('MIXER') }"
                    :title="modeTooltip('MIXER', 'MIXER')"
                    :aria-label="modeTooltip('MIXER', 'MIXER')"
                    @click="handleModePress('MIXER')"
                  >
                    <span class="control-btn__main">MIXER</span>
                  </button>

                  <button
                    class="control-btn r3 c1"
                    type="button"
                    :class="{ active: isActiveMode('BROWSER') }"
                    :title="modeTooltip('BROWSER', 'BROWSER', '+Plug-In')"
                    :aria-label="modeTooltip('BROWSER', 'BROWSER', '+Plug-In')"
                    @click="handleModePress('BROWSER', 'BROWSER_PLUGIN_MENU')"
                  >
                    <span class="control-btn__main">BROWSER</span>
                    <span class="control-btn__sub">+Plug-In</span>
                  </button>

                  <button
                    class="control-btn r3 c2"
                    type="button"
                    :class="{ active: isActiveMode('SAMPLING') }"
                    :title="modeTooltip('SAMPLING', 'SAMPLING')"
                    :aria-label="modeTooltip('SAMPLING', 'SAMPLING')"
                    @click="handleModePress('SAMPLING')"
                  >
                    <span class="control-btn__main">SAMPLING</span>
                  </button>

                  <button
                    class="control-btn control-btn--icon r4 c1"
                    type="button"
                    aria-label="Page backwards"
                    :title="pageButtonTitle('prev')"
                    @click="prevPage"
                  >
                    <span class="control-btn__main">◀</span>
                  </button>

                  <button
                    class="control-btn control-btn--icon r4 c2"
                    type="button"
                    aria-label="Page forwards"
                    :title="pageButtonTitle('next')"
                    @click="nextPage"
                  >
                    <span class="control-btn__main">▶</span>
                  </button>

                  <button
                    class="control-btn r5 c1"
                    type="button"
                    :class="{ active: isActiveMode('FILE') }"
                    :title="modeTooltip('FILE', 'FILE', 'Save')"
                    :aria-label="modeTooltip('FILE', 'FILE', 'Save')"
                    @click="handleModePress('FILE', 'FILE_SAVE')"
                  >
                    <span class="control-btn__main">FILE</span>
                    <span class="control-btn__sub">Save</span>
                  </button>

                  <button
                    class="control-btn r5 c2"
                    type="button"
                    :class="{ active: isActiveMode('SETTINGS') }"
                    :title="modeTooltip('SETTINGS', 'SETTINGS')"
                    :aria-label="modeTooltip('SETTINGS', 'SETTINGS')"
                    @click="handleModePress('SETTINGS')"
                  >
                    <span class="control-btn__main">SETTINGS</span>
                  </button>

                  <button
                    class="control-btn r6 c1"
                    type="button"
                    :class="{ active: isActiveMode('AUTO') }"
                    :title="modeTooltip('AUTO', 'AUTO')"
                    :aria-label="modeTooltip('AUTO', 'AUTO')"
                    @click="handleModePress('AUTO')"
                  >
                    <span class="control-btn__main">AUTO</span>
                  </button>

                  <button
                    class="control-btn r6 c2"
                    type="button"
                    :class="{ active: isActiveMode('MACRO') }"
                    :title="modeTooltip('MACRO', 'MACRO', 'Set')"
                    :aria-label="modeTooltip('MACRO', 'MACRO', 'Set')"
                    @click="handleModePress('MACRO', 'MACRO_SET')"
                  >
                    <span class="control-btn__main">MACRO</span>
                    <span class="control-btn__sub">Set</span>
                  </button>
                </div>
              </div>
              <div class="control-core">
                <div class="soft-row">
                  <div class="soft-row-grid">
                    <SoftButtonStrip
                      :buttons="activeSoftButtons"
                      :shift-held="shiftHeld"
                      @press="pressSoftButton"
                    />
                  </div>
                </div>
                <div class="display-block">
                  <div class="display-grid">
                    <DualDisplay
                      :left-model="leftDisplayModel"
                      :right-model="rightDisplayModel"
                      :mode-title="activeMode"
                      :page-label="pageLabel"
                      :param-slots-left="paramSlotsLeft"
                      :param-slots-right="paramSlotsRight"
                    />
                  </div>
                  <div class="display-param-labels" aria-hidden="true">
                    <span class="param-label" :title="softLabels[0]">{{ softLabels[0] }}</span>
                    <span class="param-label" :title="softLabels[1]">{{ softLabels[1] }}</span>
                    <span class="param-label" :title="softLabels[2]">{{ softLabels[2] }}</span>
                    <span class="param-label" :title="softLabels[3]">{{ softLabels[3] }}</span>
                    <span class="param-label" :title="softLabels[4]">{{ softLabels[4] }}</span>
                    <span class="param-label" :title="softLabels[5]">{{ softLabels[5] }}</span>
                    <span class="param-label" :title="softLabels[6]">{{ softLabels[6] }}</span>
                    <span class="param-label" :title="softLabels[7]">{{ softLabels[7] }}</span>
                  </div>
                </div>
                <div class="knob-row" aria-label="8 encoders">
                  <KnobControl
                    v-for="(param, index) in encoderParams"
                    :key="param.id || `encoder-${index}`"
                    :index="index"
                    :label="getParamName(index)"
                    :value="param.value"
                    :min="param.min"
                    :max="param.max"
                    :step="param.step"
                    :fine-step="param.fineStep ?? param.step"
                    :shift-held="shiftHeld"
                    :tooltip="knobTooltip(index)"
                    @turn="onKnobTurn(index, $event)"
                    @focus="onKnobFocus(index)"
                    @blur="onKnobBlur(index)"
                  />
                </div>
              </div>
            </div>
            <div class="edit-area">
              <div class="encoder-slot">
                <FourDEncoder class="four-d-encoder" />
              </div>
              <div class="quick-edit-buttons" aria-label="Quick edit controls">
                <button class="quick-edit-btn control-btn" type="button">
                  <span class="control-btn__main">VOLUME</span>
                  <span class="control-btn__sub">Velocity</span>
                </button>
                <button class="quick-edit-btn control-btn" type="button">
                  <span class="control-btn__main">SWING</span>
                  <span class="control-btn__sub">Position</span>
                </button>
                <button class="quick-edit-btn control-btn" type="button">
                  <span class="control-btn__main">TEMPO</span>
                  <span class="control-btn__sub">Tune</span>
                </button>
              </div>
            </div>
            <div class="performance-vert">
              <button class="control-btn" type="button">
                <span class="control-btn__main">NOTE REPEAT</span>
                <span class="control-btn__sub">Arp</span>
              </button>
              <div class="performance-vert__spacer" aria-hidden="true"></div>
              <button class="control-btn" type="button">
                <span class="control-btn__main">LOCK</span>
                <span class="control-btn__sub">Ext Lock</span>
              </button>
            </div>

            <div class="performance-block">
              <div class="performance-btn-row">
                <button class="control-btn" type="button">
                  <span class="control-btn__main">PITCH</span>
                </button>
                <button class="control-btn" type="button">
                  <span class="control-btn__main">MOD</span>
                </button>
                <button class="control-btn" type="button">
                  <span class="control-btn__main">PERFORMANCE</span>
                  <span class="control-btn__sub">Fx Select</span>
                </button>
                <button class="control-btn" type="button">
                  <span class="control-btn__main">NOTES</span>
                </button>
              </div>
              <div class="smart-strip" aria-hidden="true"></div>
              <div class="group-area">
                <button class="control-btn" type="button">
                  <span class="control-btn__main">A</span>
                </button>
                <button class="control-btn" type="button">
                  <span class="control-btn__main">B</span>
                </button>
                <button class="control-btn" type="button">
                  <span class="control-btn__main">C</span>
                </button>
                <button class="control-btn" type="button">
                  <span class="control-btn__main">D</span>
                </button>
                <button class="control-btn" type="button">
                  <span class="control-btn__main">E</span>
                </button>
                <button class="control-btn" type="button">
                  <span class="control-btn__main">F</span>
                </button>
                <button class="control-btn" type="button">
                  <span class="control-btn__main">G</span>
                </button>
                <button class="control-btn" type="button">
                  <span class="control-btn__main">H</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="bottom-row">
          <div class="left-column">
            <div class="transport-area" title="Transport area (MK3-style)" aria-label="Transport area (MK3-style)">
              <div class="transport-grid">
                <button class="control-btn" type="button">
                  <span class="control-btn__main">RESTART</span>
                  <span class="control-btn__sub">Loop</span>
                </button>
                <button class="control-btn" type="button">
                  <span class="control-btn__main">ERASE</span>
                  <span class="control-btn__sub">Replace</span>
                </button>
                <button class="control-btn" type="button">
                  <span class="control-btn__main">TAP</span>
                  <span class="control-btn__sub">Metro</span>
                </button>
                <button class="control-btn" type="button">
                  <span class="control-btn__main">FOLLOW</span>
                  <span class="control-btn__sub">Grid</span>
                </button>
                <button class="control-btn" type="button">
                  <span class="control-btn__main">PLAY</span>
                </button>
                <button class="control-btn" type="button">
                  <span class="control-btn__main">REC</span>
                  <span class="control-btn__sub">Count In</span>
                </button>
                <button class="control-btn" type="button">
                  <span class="control-btn__main">STOP</span>
                </button>
                <button
                  class="control-btn"
                  type="button"
                  :class="{ active: shiftHeld }"
                  :title="shiftHeld ? 'SHIFT (held)' : 'SHIFT (hold for secondary actions)'"
                  aria-label="Hold to access secondary controls"
                  :aria-pressed="shiftHeld"
                  @pointerdown="onShiftDown"
                  @pointerup="onShiftUp"
                  @pointercancel="onShiftUp"
                  @pointerleave="onShiftUpIfPressed"
                >
                  <div class="shift-label">SHIFT</div>
                </button>
              </div>
            </div>
          </div>

          <div class="right-column">
            <div class="pad-top-buttons" aria-label="Pad top buttons">
              <button class="control-btn" type="button">
                <span class="control-btn__main">FIXED VELOCITY</span>
                <span class="control-btn__sub">16 Vel</span>
              </button>
              <button class="control-btn" type="button">
                <span class="control-btn__main">PAD MODE</span>
              </button>
              <button class="control-btn" type="button">
                <span class="control-btn__main">KEYBOARD</span>
              </button>
              <button class="control-btn" type="button">
                <span class="control-btn__main">CHORDS</span>
              </button>
              <button class="control-btn" type="button">
                <span class="control-btn__main">STEP</span>
              </button>
            </div>
            <div class="pads-and-strip">
              <div class="mode-buttons" aria-label="Mode buttons">
                <button class="control-btn" type="button">
                  <span class="control-btn__main">SCENE</span>
                  <span class="control-btn__sub">Section</span>
                </button>
                <button class="control-btn" type="button">
                  <span class="control-btn__main">PATTERN</span>
                </button>
                <button class="control-btn" type="button">
                  <span class="control-btn__main">EVENTS</span>
                </button>
                <button class="control-btn" type="button">
                  <span class="control-btn__main">VARIATION</span>
                  <span class="control-btn__sub">Navigate</span>
                </button>
                <button class="control-btn" type="button">
                  <span class="control-btn__main">DUPLICATE</span>
                  <span class="control-btn__sub">Double</span>
                </button>
                <button class="control-btn" type="button">
                  <span class="control-btn__main">SELECT</span>
                </button>
                <button class="control-btn" type="button">
                  <span class="control-btn__main">SOLO</span>
                </button>
                <button class="control-btn" type="button">
                  <span class="control-btn__main">MUTE</span>
                  <span class="control-btn__sub">Choke</span>
                </button>
              </div>
              <div class="pads-column">
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
import { useControlStore, type ControlMode } from '@/stores/control'
import { useBrowserStore } from '@/stores/browser'
import { useSequencer } from '@/composables/useSequencer'
import { useSync } from '@/composables/useSync.client'
import { useMidi } from '@/composables/useMidi.client'
import { usePatternStorage } from '@/composables/usePatternStorage.client'
import { useSoundbankStorage } from '@/composables/useSoundbankStorage.client'
import { useImportExport } from '@/composables/useImportExport.client'
import { useCapabilities } from '@/composables/useCapabilities.client'
import { useMidiLearn } from '@/composables/useMidiLearn'
import { useShortcuts } from '@/composables/useShortcuts'
import { SHORTCUT_COMMANDS } from '@/composables/shortcutCommands'
import { getFileSystemRepository } from '@/services/fileSystemRepository'
import TransportBar from './TransportBar.vue'
import PadGrid from './PadGrid.vue'
import TabPanel from './TabPanel.vue'
import SoundPanel from './panels/SoundPanel.vue'
import FxPanel from './panels/FxPanel.vue'
import PatternsPanel from './panels/PatternsPanel.vue'
import ExportPanel from './panels/ExportPanel.vue'
import { createZip, type ZipEntry } from '@/utils/zip'
import type { DrumPadId, Scene } from '@/types/drums'
import type { GridSpec, TimeDivision } from '@/types/time'
import type { FxSettings, SampleRef, Soundbank } from '@/types/audio'
import type { RenderEvent, RenderMetadata } from '@/types/render'
import type { StepGrid } from '@/types/drums'
import DualDisplay from './control/DualDisplay.vue'
import SoftButtonStrip from './control/SoftButtonStrip.vue'
import KnobControl from './KnobControl.vue'
import FourDEncoder from './control/FourDEncoder.vue'
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
    DualDisplay,
    SoftButtonStrip,
    KnobControl,
    FourDEncoder,
    ModeColumnPlaceholder,
    TouchStripPlaceholder
  },
  // ModeColumnPlaceholder currently unused; consider removing or wiring into the layout.
  data() {
    const transport = useTransportStore()
    const patterns = usePatternsStore()
    const soundbanks = useSoundbanksStore()
    const session = useSessionStore()
    const control = useControlStore()
    const browser = useBrowserStore()
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
      control,
      browser,
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
      midiMode: false,
      shiftPointerActive: false,
      focusedEncoderIndex: 0 as number | null,
      lastNonBrowserMode: control.activeMode as ControlMode | null
    }
  },


computed: {
  activeMode(): ControlMode {
    return this.control.modeTitle as ControlMode
  },

  shiftHeld(): boolean {
    return this.control.shiftHeld
  },

  pageLabel(): string {
    return this.control.pageLabel
  },

  activeSoftButtons() {
    return this.control.activeSoftButtons
  },

  softLabels(): string[] {
    return this.control.softLabels
  },

  leftDisplayModel() {
    return this.control.leftModel
  },

  rightDisplayModel() {
    return this.control.rightModel
  },

  paramSlotsLeft() {
    return this.control.paramSlotsLeft
  },

  paramSlotsRight() {
    return this.control.paramSlotsRight
  },

  encoderParams() {
    return this.control.activeParams ?? []
  },

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
    this.registerShortcuts()
    window.addEventListener('keydown', this.handleGlobalShortcut)
    window.addEventListener('keydown', this.handleGridKeys)
    window.addEventListener('keydown', this.handleShiftKeyDown)
    window.addEventListener('keyup', this.handleShiftKeyUp)
    window.addEventListener('pointerup', this.handleGlobalPointerUp)
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
    void this.browser.setMode('LIBRARY')
    this.control.setBrowserDisplay(this.browser.toDisplayModels())
    const stopBrowserDisplayWatch = this.$watch(
      () => ({
        mode: this.browser.mode,
        query: this.browser.library.query,
        results: this.browser.library.results,
        selectedId: this.browser.library.selectedId,
        path: this.browser.files.currentPath,
        entries: this.browser.files.entries,
        selectedPath: this.browser.files.selectedPath
      }),
      () => {
        this.control.setBrowserDisplay(this.browser.toDisplayModels())
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
    this.unwatchers.push(stopBrowserDisplayWatch)
    this.unwatchers.push(() => stopMidiListener?.())
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleGlobalShortcut)
    window.removeEventListener('keydown', this.handleGridKeys)
    window.removeEventListener('keydown', this.handleShiftKeyDown)
    window.removeEventListener('keyup', this.handleShiftKeyUp)
    window.removeEventListener('pointerup', this.handleGlobalPointerUp)
    this.clearCountInTimer()
    this.unwatchers.forEach((stop) => stop())
  },

  methods: {
    registerShortcuts() {
      const shortcuts = useShortcuts()
      // Transport
      shortcuts.register('TRANSPORT_PLAY', {
        keys: SHORTCUT_COMMANDS.TRANSPORT_PLAY,
        handler: () => void this.start(),
        description: 'Play'
      })
      shortcuts.register('TRANSPORT_STOP', {
        keys: SHORTCUT_COMMANDS.TRANSPORT_STOP,
        handler: () => this.stop(),
        description: 'Stop'
      })
      shortcuts.register('TRANSPORT_RECORD', {
        keys: SHORTCUT_COMMANDS.TRANSPORT_RECORD,
        handler: () => this.toggleRecord(),
        description: 'Record'
      })
      shortcuts.register('TRANSPORT_TAP_TEMPO', {
        keys: SHORTCUT_COMMANDS.TRANSPORT_TAP_TEMPO,
        handler: () => this.tapTempo(),
        description: 'Tap Tempo'
      })
      shortcuts.register('TRANSPORT_METRONOME', {
        keys: SHORTCUT_COMMANDS.TRANSPORT_METRONOME,
        handler: () => this.toggleMetronome(),
        description: 'Toggle Metronome'
      })
      shortcuts.register('TRANSPORT_COUNT_IN', {
        keys: SHORTCUT_COMMANDS.TRANSPORT_COUNT_IN,
        handler: () => this.toggleCountIn(),
        description: 'Toggle Count-In'
      })
      shortcuts.register('TRANSPORT_LOOP', {
        keys: SHORTCUT_COMMANDS.TRANSPORT_LOOP,
        handler: () => this.transport.setLoop(!this.transport.loop),
        description: 'Toggle Loop'
      })
      shortcuts.register('TRANSPORT_FOLLOW', {
        keys: SHORTCUT_COMMANDS.TRANSPORT_FOLLOW,
        handler: () => this.toggleFollow(),
        description: 'Toggle Follow'
      })
      // Browser
      shortcuts.register('BROWSER_TOGGLE', {
        keys: SHORTCUT_COMMANDS.BROWSER_TOGGLE,
        handler: () => void this.toggleBrowser(),
        description: 'Toggle Browser'
      })
      shortcuts.register('BROWSER_MODE_LIBRARY', {
        keys: SHORTCUT_COMMANDS.BROWSER_MODE_LIBRARY,
        handler: () => void this.browser.setMode('LIBRARY'),
        description: 'Browser: Library Mode'
      })
      shortcuts.register('BROWSER_MODE_FILES', {
        keys: SHORTCUT_COMMANDS.BROWSER_MODE_FILES,
        handler: () => void this.browser.setMode('FILES'),
        description: 'Browser: Files Mode'
      })
      shortcuts.register('BROWSER_CLOSE', {
        keys: SHORTCUT_COMMANDS.BROWSER_CLOSE,
        handler: () => this.closeBrowser(),
        description: 'Close Browser'
      })
      shortcuts.register('BROWSER_SEARCH_FOCUS', {
        keys: SHORTCUT_COMMANDS.BROWSER_SEARCH_FOCUS,
        handler: () => void this.focusBrowserSearch(),
        description: 'Focus Browser Search'
      })
      shortcuts.register('BROWSER_CLEAR_SEARCH', {
        keys: SHORTCUT_COMMANDS.BROWSER_CLEAR_SEARCH,
        handler: () => this.clearBrowserSearch(),
        description: 'Clear Browser Search'
      })
      shortcuts.register('BROWSER_NAV_UP', {
        keys: SHORTCUT_COMMANDS.BROWSER_NAV_UP,
        handler: () => {
          if (this.control.activeMode === 'BROWSER' || this.control.activeMode === 'FILE') {
            void this.browserSelectionDelta(-1)
          } else {
            this.adjustFocusedEncoder(1, false)
          }
        },
        description: 'Browser: Previous Item'
      })
      shortcuts.register('BROWSER_NAV_DOWN', {
        keys: SHORTCUT_COMMANDS.BROWSER_NAV_DOWN,
        handler: () => {
          if (this.control.activeMode === 'BROWSER' || this.control.activeMode === 'FILE') {
            void this.browserSelectionDelta(1)
          } else {
            this.adjustFocusedEncoder(-1, false)
          }
        },
        description: 'Browser: Next Item'
      })
      shortcuts.register('BROWSER_NAV_BACK', {
        keys: SHORTCUT_COMMANDS.BROWSER_NAV_BACK,
        handler: () => void this.browserNavBack(),
        description: 'Browser: Up Folder'
      })
      shortcuts.register('BROWSER_NAV_INTO', {
        keys: SHORTCUT_COMMANDS.BROWSER_NAV_INTO,
        handler: () => void this.browserNavInto(),
        description: 'Browser: Enter Item'
      })
      shortcuts.register('BROWSER_PREVIEW_TOGGLE', {
        keys: SHORTCUT_COMMANDS.BROWSER_PREVIEW_TOGGLE,
        handler: () => void this.browser.prehearSelected(),
        description: 'Browser: Preview Selected'
      })
      shortcuts.register('BROWSER_IMPORT_TO_PAD', {
        keys: SHORTCUT_COMMANDS.BROWSER_IMPORT_TO_PAD,
        handler: () => void this.importSelectedToPad(),
        description: 'Import selected file to current pad'
      })
      shortcuts.register('BROWSER_LOAD_SELECTED_TO_PAD', {
        keys: SHORTCUT_COMMANDS.BROWSER_LOAD_SELECTED_TO_PAD,
        handler: () => void this.importSelectedToPad(),
        description: 'Load selected to pad'
      })
      // Encoders / knobs
      shortcuts.register('KNOB_INC', {
        keys: SHORTCUT_COMMANDS.KNOB_INC,
        handler: () => this.adjustFocusedEncoder(1, false),
        description: 'Increase focused encoder'
      })
      shortcuts.register('KNOB_DEC', {
        keys: SHORTCUT_COMMANDS.KNOB_DEC,
        handler: () => this.adjustFocusedEncoder(-1, false),
        description: 'Decrease focused encoder'
      })
      shortcuts.register('KNOB_INC_FINE', {
        keys: SHORTCUT_COMMANDS.KNOB_INC_FINE,
        handler: () => this.adjustFocusedEncoder(1, true),
        description: 'Increase focused encoder (fine)'
      })
      shortcuts.register('KNOB_DEC_FINE', {
        keys: SHORTCUT_COMMANDS.KNOB_DEC_FINE,
        handler: () => this.adjustFocusedEncoder(-1, true),
        description: 'Decrease focused encoder (fine)'
      })
      // 4D encoder
      shortcuts.register('ENC4D_TURN_INC', {
        keys: SHORTCUT_COMMANDS.ENC4D_TURN_INC,
        handler: () => this.control.turnEncoder4D(1),
        description: '4D Encoder Turn +'
      })
      shortcuts.register('ENC4D_TURN_DEC', {
        keys: SHORTCUT_COMMANDS.ENC4D_TURN_DEC,
        handler: () => this.control.turnEncoder4D(-1),
        description: '4D Encoder Turn -'
      })
      shortcuts.register('ENC4D_TILT_LEFT', {
        keys: SHORTCUT_COMMANDS.ENC4D_TILT_LEFT,
        handler: () => this.control.tiltEncoder4D('left'),
        description: '4D Encoder Tilt Left'
      })
      shortcuts.register('ENC4D_TILT_RIGHT', {
        keys: SHORTCUT_COMMANDS.ENC4D_TILT_RIGHT,
        handler: () => this.control.tiltEncoder4D('right'),
        description: '4D Encoder Tilt Right'
      })
      shortcuts.register('ENC4D_PRESS', {
        keys: SHORTCUT_COMMANDS.ENC4D_PRESS,
        handler: () => void this.control.pressEncoder4D(),
        description: '4D Encoder Press'
      })
      // Pads
      const padMap: Record<string, DrumPadId> = {
        '1': 'pad1', '2': 'pad2', '3': 'pad3', '4': 'pad4',
        'q': 'pad5', 'w': 'pad6', 'e': 'pad7', 'r': 'pad8',
        'a': 'pad9', 's': 'pad10', 'd': 'pad11', 'f': 'pad12',
        'z': 'pad13', 'x': 'pad14', 'c': 'pad15', 'v': 'pad16'
      }
      Object.entries(padMap).forEach(([_key, padId], index) => {
        shortcuts.register(`PAD_SELECT_${index + 1}`, {
          keys: SHORTCUT_COMMANDS[`PAD_SELECT_${index + 1}` as keyof typeof SHORTCUT_COMMANDS],
          handler: () => void this.handlePad(padId),
          description: `Select Pad ${index + 1}`
        })
      })
      // Modes
      shortcuts.register('MODE_BROWSER', {
        keys: SHORTCUT_COMMANDS.MODE_BROWSER,
        handler: () => this.handleModePress('BROWSER'),
        description: 'Browser Mode'
      })
      // Undo/Redo
      shortcuts.register('UNDO', {
        keys: SHORTCUT_COMMANDS.UNDO,
        handler: () => this.undoPattern(),
        description: 'Undo'
      })
      shortcuts.register('REDO', {
        keys: SHORTCUT_COMMANDS.REDO,
        handler: () => this.redoPattern(),
        description: 'Redo'
      })
    },
    handleGlobalShortcut(event: KeyboardEvent) {
      // Skip if typing in input/textarea
      const target = event.target as HTMLElement
      if (event.defaultPrevented) return
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable) return

      const shortcuts = useShortcuts()
      shortcuts.dispatch(event)
    },
    handleModePress(mode: ControlMode, shiftActionId?: string) {
      if (mode === 'BROWSER') {
        if (this.control.activeMode !== 'BROWSER') {
          this.lastNonBrowserMode = this.control.activeMode as ControlMode
        }
      } else {
        this.lastNonBrowserMode = mode
      }
      this.control.setMode(mode)
      if (mode === 'BROWSER') {
        void this.browser.setMode('LIBRARY')
        this.control.setBrowserDisplay(this.browser.toDisplayModels())
      } else if (mode === 'FILE') {
        void this.browser.setMode('FILES')
        this.control.setBrowserDisplay(this.browser.toDisplayModels())
      }
      if (this.shiftHeld && shiftActionId) {
        this.control.applyAction(shiftActionId, mode)
      }
    },
    isActiveMode(mode: ControlMode): boolean {
      return this.control.activeMode === mode
    },
    shortcutTitle(commandId: string, label: string): string {
      const shortcuts = useShortcuts()
      return shortcuts.title(commandId, label)
    },
    modeTooltip(mode: ControlMode, primary: string, secondary?: string) {
      const shortcuts = useShortcuts()
      const commandMap: Record<string, string> = {
        BROWSER: 'MODE_BROWSER',
        CHANNEL: 'MODE_CHANNEL',
        PLUGIN: 'MODE_PLUGIN',
        ARRANGER: 'MODE_ARRANGER',
        MIXER: 'MODE_MIXER',
        SAMPLING: 'MODE_SAMPLING'
      }
      const commandId = commandMap[mode]
      const base = secondary ? `${primary} (SHIFT: ${secondary})` : primary
      return commandId ? shortcuts.title(commandId, base) : base
    },
    async ensureBrowserMode() {
      if (this.control.activeMode !== 'BROWSER' && this.control.activeMode !== 'FILE') {
        this.lastNonBrowserMode = this.control.activeMode as ControlMode
        this.handleModePress('BROWSER')
      }
      this.control.setBrowserDisplay(this.browser.toDisplayModels())
      await this.$nextTick()
    },
    async toggleBrowser() {
      if (this.control.activeMode === 'BROWSER') {
        this.closeBrowser()
        return
      }
      await this.ensureBrowserMode()
    },
    closeBrowser() {
      const fallbackMode = this.lastNonBrowserMode ?? 'CHANNEL'
      this.control.setMode(fallbackMode as ControlMode)
    },
    browserEntries(): Array<{ id: string; path?: string; isDir?: boolean }> {
      if (this.browser.mode === 'FILES') {
        const dirs = this.browser.files.entries?.dirs ?? []
        const files = this.browser.files.entries?.files ?? []
        return [
          ...dirs.map((entry) => ({ id: entry.path, path: entry.path, isDir: true })),
          ...files.map((entry) => ({ id: entry.path, path: entry.path, isDir: false }))
        ]
      }
      return (this.browser.library.results ?? []).map((item) => {
        const result: { id: string; path?: string; isDir?: boolean } = { id: item.id, isDir: false }
        if (item.path) {
          result.path = item.path
        }
        return result
      })
    },
    setBrowserSelectionByIndex(items: Array<{ id: string; path?: string; isDir?: boolean }>, index: number) {
      const entry = items[index]
      if (!entry) return
      if (this.browser.mode === 'FILES') {
        this.browser.selectPath(entry.path ?? null)
      } else {
        void this.browser.selectResult(entry.id)
      }
    },
    async browserSelectionDelta(delta: number) {
      await this.ensureBrowserMode()
      const items = this.browserEntries()
      if (!items.length) return
      const currentId = this.browser.mode === 'FILES' ? this.browser.files.selectedPath : this.browser.library.selectedId
      const currentIndex = items.findIndex((item) => item.id === currentId)
      const baseIndex = currentIndex >= 0 ? currentIndex : 0
      const nextIndex = Math.min(Math.max(baseIndex + delta, 0), items.length - 1)
      this.setBrowserSelectionByIndex(items, nextIndex)
    },
    async browserNavBack() {
      await this.ensureBrowserMode()
      if (this.browser.mode === 'FILES') {
        const current = this.browser.files.currentPath || '/'
        const segments = current.split('/').filter(Boolean)
        if (segments.length === 0) return
        segments.pop()
        const parent = segments.length > 0 ? `/${segments.join('/')}` : '/'
        await this.browser.listDir(parent)
        const items = this.browserEntries()
        if (items.length > 0) {
          this.setBrowserSelectionByIndex(items, 0)
        }
        return
      }
      this.browser.selectResult(null)
    },
    async browserNavInto() {
      await this.ensureBrowserMode()
      if (this.browser.mode === 'FILES') {
        const selectedPath = this.browser.files.selectedPath
        if (!selectedPath) return
        const repo = getFileSystemRepository()
        const stat = await repo.stat(selectedPath)
        if (stat?.isDir) {
          await this.browser.listDir(selectedPath)
          const items = this.browserEntries()
          if (items.length > 0) {
            this.setBrowserSelectionByIndex(items, 0)
          }
          return
        }
        await this.browser.importSelected({ contextId: this.selectedPadId, contextType: 'sample' })
        return
      }
      if (!this.browser.library.selectedId && this.browser.library.results[0]) {
        await this.browser.selectResult(this.browser.library.results[0].id)
        return
      }
      await this.browser.importSelected({ contextId: this.selectedPadId, contextType: 'sample' })
    },
    async focusBrowserSearch() {
      await this.ensureBrowserMode()
      await this.$nextTick()
      this.focusBrowserSearchInput()
    },
    focusBrowserSearchInput() {
      const searchEl = this.$el.querySelector('.browser-search') as HTMLInputElement | null
      if (searchEl) {
        searchEl.focus()
        searchEl.select?.()
      }
    },
    clearBrowserSearch() {
      void this.browser.setQuery('')
      this.focusBrowserSearchInput()
    },
    pageButtonTitle(direction: 'prev' | 'next') {
      return `${direction === 'prev' ? 'Previous' : 'Next'} page (${this.pageLabel})`
    },
    prevPage() {
      this.control.prevPage()
    },
    nextPage() {
      this.control.nextPage()
    },
    pressSoftButton(index: number) {
      const btn = this.control.activeSoftButtons[index]
      const actionId = this.control.shiftHeld && btn?.shiftActionId ? btn.shiftActionId : btn?.actionId
      if (actionId === 'BROWSER_IMPORT_TO_PAD') {
        void this.importSelectedToPad()
        return
      }
      this.control.pressSoftButton(index)
    },
    onShiftDown(event: PointerEvent) {
      event.preventDefault()
      this.shiftPointerActive = true
      this.control.setShiftHeld(true)
    },
    onShiftUp() {
      this.shiftPointerActive = false
      this.control.setShiftHeld(false)
    },
    onShiftUpIfPressed() {
      if (this.shiftPointerActive) {
        this.onShiftUp()
      }
    },
    handleGlobalPointerUp() {
      if (this.shiftPointerActive) {
        this.onShiftUp()
      }
    },
    handleShiftKeyDown(event: KeyboardEvent) {
      if (event.key === 'Shift') {
        this.control.setShiftHeld(true)
      }
    },
    handleShiftKeyUp(event: KeyboardEvent) {
      if (event.key === 'Shift') {
        this.control.setShiftHeld(false)
      }
    },
    onKnobTurn(index: number, payload: { delta: number; fine?: boolean }) {
      const delta = payload?.delta ?? 0
      if (!delta) return
      this.focusedEncoderIndex = index
      this.control.turnEncoder(index, delta, { fine: payload?.fine ?? this.shiftHeld })
    },
    onKnobFocus(index: number) {
      this.focusedEncoderIndex = index
    },
    onKnobBlur(index: number) {
      this.focusedEncoderIndex = index
    },
    adjustFocusedEncoder(delta: number, fine = false) {
      const index = this.focusedEncoderIndex ?? 0
      const clamped = Math.min(Math.max(index, 0), Math.max(0, (this.encoderParams?.length ?? 1) - 1))
      this.focusedEncoderIndex = clamped
      this.control.turnEncoder(clamped, delta, { fine })
    },
    getParamName(index: number) {
      return this.encoderParams?.[index]?.name ?? `Encoder ${index + 1}`
    },
    knobTooltip(index: number): string {
      return this.shortcutTitle('KNOB_INC', this.getParamName(index))
    },
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
      const normalized = Math.max(1, Math.min(8, Math.floor(bars))) as GridSpec['bars']
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
      const bars = Math.max(1, Math.min(8, Math.floor(value ?? 1))) as GridSpec['bars']
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
    async importSelectedToPad() {
      if (!this.browser.files.selectedPath) return
      const importedItem = await this.browser.importSelected({
        contextId: this.selectedPadId,
        contextType: 'sample'
      })
      if (!importedItem?.path) return
      const fileRepo = getFileSystemRepository()
      const blob = await fileRepo.readFileBlob?.(importedItem.path)
      if (!blob) return
      const file = new File([blob], importedItem.name, { type: blob.type || 'audio/wav' })
      await this.replacePadSample({ padId: this.selectedPadId, file })
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
  width: min(
    calc((100svh - (2 * var(--stage-pad))) * (1080 / 760))
  );
}

.top-row {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: auto auto;
  gap: var(--device-gap);
  align-items: start;
  min-height: 0;
}

.control-stack {
  display: grid;
  grid-template-columns: var(--control-cols, repeat(8, 1fr));
  grid-template-rows: auto auto;
  column-gap: var(--control-col-gap, @space-xs);
  row-gap: var(--device-gap);
  width: 100%;
}

.control-area {
  --control-row-h: clamp(44px, 4.2vh, 56px);
  --control-cols: repeat(8, 1fr);
  --control-col-gap: @space-xs;
  grid-column: 1 / -1;
  grid-row: 1;
  display: grid;
  grid-template-columns: clamp(210px, 18%, 280px) 1fr;
  gap: var(--device-gap);
  min-width: 0;
  min-height: 0;
  align-items: stretch;
  width: 100%;
}

.control-fixed {
  min-width: 0;
  display: flex;
  align-items: flex-start;
}

.control-btn-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: repeat(6, var(--control-row-h));
  gap: @space-xxs;
  width: 100%;
  max-width: 100%;
}

.control-btn.r1 { grid-row: 1; }
.control-btn.r2 { grid-row: 2; }
.control-btn.r3 { grid-row: 3; }
.control-btn.r4 { grid-row: 4; }
.control-btn.r5 { grid-row: 5; }
.control-btn.r6 { grid-row: 6; }
.control-btn.c1 { grid-column: 1; }
.control-btn.c2 { grid-column: 2; }

.control-btn {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid fade(#3b4355, 65%);
  background: linear-gradient(180deg, #1c2230, #121826);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
  color: rgba(255, 255, 255, 0.88);
  line-height: 1.05;
  text-align: left;
  min-height: 44px;
  max-width: 100%;
}

.control-btn__main {
  font-weight: 800;
  letter-spacing: 0.06em;
  font-size: 12px;
  text-transform: uppercase;
}

.control-btn__sub {
  margin-top: 2px;
  font-weight: 400;
  font-style: italic;
  opacity: 0.75;
  font-size: 11px;
  letter-spacing: 0.02em;
  text-transform: none;
}

.control-btn--icon {
  align-items: center;
  text-align: center;
}

.control-btn--icon .control-btn__main {
  font-size: 16px;
  letter-spacing: 0;
}

.control-core {
  display: grid;
  grid-template-rows: repeat(6, var(--control-row-h));
  gap: 0;
  min-width: 0;
  --control-cols: repeat(8, 1fr);
  --control-col-gap: @space-xs;
}

.soft-row {
  grid-row: 1;
  height: var(--control-row-h);
  min-width: 0;
  display: flex;
  align-items: center;
}

.drum-machine-shell :deep(.soft-row) {
  grid-row: 1;
  height: var(--control-row-h);
  min-width: 0;
  display: flex;
  align-items: center;
}

.soft-row-grid {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: var(--control-cols);
  column-gap: var(--control-col-gap);
}

.soft-row :deep(.soft-strip) {
  display: grid;
  grid-template-columns: var(--control-cols);
  column-gap: var(--control-col-gap);
  height: 100%;
  grid-column: 1 / -1;
}

.soft-row :deep(.soft-btn) {
  min-height: 100%;
}

.soft-row :deep(*) {
  height: 100%;
  min-height: 0;
  width: 100%;
}

.display-block {
  grid-row: 2 / span 4;
  position: relative;
  min-width: 0;
  min-height: 0;
  height: calc(var(--control-row-h) * 4);
  display: grid;
  align-items: stretch;
}

.display-grid {
  display: grid;
  grid-template-columns: var(--control-cols);
  column-gap: var(--device-gap);
  height: 100%;
}

.drum-machine-shell :deep(.display-grid) {
  display: grid;
  grid-template-columns: var(--control-cols);
  column-gap: var(--device-gap);
  height: 100%;
}

.display-grid :deep(.dual-display-root),
.display-grid :deep(.dual-display),
.display-grid :deep(.dual-display-placeholder) {
  height: 100%;
  min-height: 0;
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: var(--control-cols);
  column-gap: var(--control-col-gap);
  row-gap: 0;
}

.display-grid :deep(.dual-display .display) {
  grid-column: span 4;
  min-width: 0;
}

.display-grid :deep(.dual-display .display:nth-child(1)) {
  grid-column: 1 / span 4;
}

.display-grid :deep(.dual-display .display:nth-child(2)) {
  grid-column: 5 / span 4;
}

.display-param-labels {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 0 8px 6px 8px;
  display: grid;
  grid-template-columns: var(--control-cols);
  column-gap: var(--control-col-gap);
  pointer-events: none;
}

.param-label {
  justify-self: center;
  font-size: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.75;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.knob-row {
  grid-row: 6;
  height: var(--control-row-h);
  display: grid;
  grid-template-columns: var(--control-cols);
  align-items: center;
  gap: var(--device-gap);
  padding: 12px 8px;
  min-width: 0;
  --knob-y: 0px;
}

.knob {
  justify-self: center;
  width: var(--control-row-h);
  height: var(--control-row-h);
  transform: translateY(var(--knob-y));
   --knob-angle: 0deg;
  border-radius: 999px;
  background: radial-gradient(circle at 30% 30%, #3a4150, #151a24 70%);
  border: 1px solid rgba(255,255,255,0.1);
  box-shadow:
    inset 0 2px 4px rgba(0,0,0,0.7),
    0 1px 0 rgba(255,255,255,0.06);
  position: relative;
}

.knob::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 50%;
  width: 2px;
  height: 38%;
  transform: translateX(-50%) rotate(var(--knob-angle));
  border-radius: 2px;
  background: rgba(246, 139, 30, 0.9);
  box-shadow: 0 0 6px rgba(246, 139, 30, 0.35);
}

.edit-area {
  --edit-btn-h: clamp(34px, 4.2vh, 44px);
  --edit-row-gap: @space-xxs;
  --edit-stack-d: calc((3 * var(--edit-btn-h)) + (2 * var(--edit-row-gap)));

  /* statt grid-column: 1 / span 3; */
  grid-column: 1 / 3;     
  grid-row: 6;             
  justify-self: normal;

  --core-w: calc(100% - var(--fixed-col-w) - var(--device-gap));

  margin-left: calc(var(--fixed-col-w) - var(--device-gap));
  width: calc(var(--core-w) * 0.375); /* 3/8 = 0.375 */

  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: repeat(3, var(--edit-btn-h));
  column-gap: var(--control-col-gap);
  row-gap: var(--edit-row-gap);
  flex-direction: column;
  align-items: start;
  justify-items: center;
  align-self: start;
  margin-top: calc(var(--device-gap) * 0.5);
  min-height: 0;
  min-width: 0;
}

.encoder-slot {
  grid-column: 1 / 3;
  grid-row: 1 / -1;
  display: grid;
  padding-left: 30%;
  align-items: start;
  justify-content: center;
  justify-self: start;
  align-self: start;
  width: var(--edit-stack-d);
  height: var(--edit-stack-d);
}



.quick-edit-buttons {
  grid-column: 3 / -1;
  grid-row: 1;
  display: grid;
  grid-template-rows: repeat(3, var(--edit-btn-h));
  row-gap: var(--edit-row-gap);
  align-content: start;
  align-items: start;

}

.quick-edit-btn {
  min-height: var(--edit-btn-h);
  height: var(--edit-btn-h);
  width: 100%;
}

.four-d-encoder {
  position: relative;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #3c4352, #121722 70%);
  border: 1px solid rgba(255,255,255,0.12);
  box-shadow:
    inset 0 3px 6px rgba(0,0,0,0.65),
    0 2px 6px rgba(0,0,0,0.45);
}

.four-d-encoder::after {
  content: '';
  position: absolute;
  top: 6%;
  left: 50%;
  width: 3px;
  height: 30%;
  transform: translateX(-50%);
  border-radius: 2px;
  background: rgba(246, 139, 30, 0.95);
  box-shadow: 0 0 10px rgba(246, 139, 30, 0.35);
}

.bottom-row {
  display: grid;
  grid-template-columns: clamp(220px, 24%, 320px) minmax(0, 1fr);
  grid-template-areas: 'left right';
  gap: var(--device-gap);
  min-height: 0;
}

.drum-machine-shell :deep(.bottom-row) {
  display: grid;
  grid-template-columns: clamp(220px, 24%, 320px) minmax(0, 1fr);
  grid-template-areas: 'left right';
  gap: var(--device-gap);
  min-height: 0;
}

.left-column {
  grid-area: left;
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

.drum-machine-shell :deep(.drawer-shell) {
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
  grid-area: right;
  display: flex;
  flex-direction: column;
  gap: var(--device-gap);
  min-height: 0;
}

.drum-machine-shell :deep(.right-column) {
  grid-area: right;
  display: flex;
  flex-direction: column;
  gap: var(--device-gap);
  min-height: 0;
}

.pads-and-strip {
  display: grid;
  //grid-template-columns: clamp(90px, 18%, 140px) minmax(0, 1fr);
  grid-template-areas: 'strip pads';
  gap: var(--device-gap);
  align-items: end;
  width: 100%;
  min-height: 0;
}

.drum-machine-shell :deep(.pads-and-strip) {
  display: grid;
  grid-template-areas: 'strip pads';
  gap: var(--device-gap);
  align-items: end;
  width: 100%;
  min-height: 0;
}

.strip-column {
  grid-area: strip;
  align-self: end;
  justify-self: start;
  min-height: 0;
}

.pads-column {
  grid-area: pads;
  min-width: 0;
}

.pads-stack {
  display: grid;
  grid-columns: 4 / -1;
  grid-rows: 4 / -1;
  flex-direction: column;
  gap: @space-xs;
  align-items: end;
  justify-content: end;
  //width: 80%;
  min-width: 0;
  min-height: 0;
  align-self: end;
  justify-self: end;
  background: linear-gradient(180deg, #191d27, #10141d);
  border: 1px solid fade(#3b4355, 60%);
  border-radius: @radius-m;
  padding: @space-s;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

.drum-machine-shell :deep(.pads-stack) {
  display: grid;
  grid-columns: 4 / -1;
  grid-rows: 4 / -1;
  flex-direction: column;
  gap: @space-xs;
  align-items: end;
  justify-content: end;
  min-width: 0;
  min-height: 0;
  align-self: end;
  justify-self: end;
  background: linear-gradient(180deg, #191d27, #10141d);
  border: 1px solid fade(#3b4355, 60%);
  border-radius: @radius-m;
  padding: @space-s;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

.pads-square {
  width: 100%;
  // max-width: clamp(420px, 62%, 960px);
  aspect-ratio: 1 / 1;
  min-height: 0;
  display: flex;
}

.drum-machine-shell :deep(.pads-square) {
  width: 100%;
  aspect-ratio: 1 / 1;
  min-height: 0;
  display: flex;
}

.pads-square > * {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
}

.pads-square > :deep(*) {
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
  z-index: 5;
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
  z-index: 6;
}

.pad-grid-indicator {
  display: flex;
  justify-content: center;
  gap: @space-xs;
  padding: @space-xxs;
  background: rgba(255, 255, 255, 0.02);
  border-radius: @radius-s;
}

.drum-machine-shell :deep(.pad-grid-indicator) {
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

  .drum-machine-shell :deep(.bottom-row) {
    grid-template-columns: 320px 1fr;
  }

  .drum-machine-shell :deep(.pads-square) {
    width: clamp(360px, 48vw, 520px);
  }
}

@media (max-width: 960px) {
  .device-hardware {
    grid-template-rows: auto auto 1fr;
  }

  .top-row {
    grid-template-columns: 1fr;
    gap: @space-s;
    align-items: start;
  }
  
  .control-area {
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
    grid-template-areas:
      'strip'
      'pads';
    justify-items: center;
    align-items: center;
  }

  .drawer-shell {
    max-height: 45vh;
  }

  .drum-machine-shell :deep(.bottom-row) {
    grid-template-columns: 1fr;
  }

  .drum-machine-shell :deep(.right-column) {
    grid-template-columns: 1fr;
  }

  .drum-machine-shell :deep(.pads-and-strip) {
    grid-template-columns: 1fr;
    grid-template-areas:
      'strip'
      'pads';
    justify-items: center;
    align-items: center;
  }

  .drum-machine-shell :deep(.drawer-shell) {
    max-height: 45vh;
  }
}

.edit-area {
  grid-column: 1 / 3;
  grid-row: 2;
}

.performance-vert {
  grid-column: 4;
  grid-row: 2;
  display: grid;
  grid-template-rows: repeat(3, var(--edit-btn-h, clamp(34px, 4.2vh, 44px)));
  row-gap: var(--edit-row-gap, @space-xxs);
  align-self: end;
  justify-self: stretch;
  width: 100%;
}

.performance-vert .control-btn {
  width: 100%;
  min-height: var(--edit-btn-h, clamp(34px, 4.2vh, 44px));
}

.performance-vert__spacer {
  width: 100%;
  height: 100%;
}

.performance-block {
  grid-column: 1 / span 4;
  grid-row: 3;
  display: grid;
  grid-template-rows: auto auto auto;
  row-gap: var(--edit-row-gap, @space-xxs);
  align-self: start;
  justify-self: stretch;
  width: 100%;
}

.performance-btn-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: @space-xxs;
}

.performance-btn-row .control-btn {
  width: 100%;
  min-height: var(--edit-btn-h, clamp(34px, 4.2vh, 44px));
}

.smart-strip {
  width: 100%;
  height: clamp(46px, 5vh, 64px);
  border-radius: @radius-m;
  background: linear-gradient(90deg, #2a2f3a, #141824);
  border: 1px solid fade(#3b4355, 60%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

.group-area {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(2, var(--edit-btn-h, clamp(34px, 4.2vh, 44px)));
  gap: @space-xxs;
}

.group-area .control-btn {
  width: 100%;
  min-height: var(--edit-btn-h, clamp(34px, 4.2vh, 44px));
}

.transport-area {
  background: linear-gradient(180deg, #1f2531, #141924);
  border: 1px solid fade(#3b4355, 65%);
  border-radius: @radius-m;
  padding: @space-s;
  min-height: 0;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
  width: 100%;
}

.drum-machine-shell :deep(.transport-area) {
  background: linear-gradient(180deg, #1f2531, #141924);
  border: 1px solid fade(#3b4355, 65%);
  border-radius: @radius-m;
  padding: @space-s;
  min-height: 0;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
  width: 100%;
}

.transport-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(2, var(--edit-btn-h, clamp(34px, 4.2vh, 44px)));
  gap: @space-xxs;
}

.drum-machine-shell :deep(.transport-grid) {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(2, var(--edit-btn-h, clamp(34px, 4.2vh, 44px)));
  gap: @space-xxs;
}

.shift-label {
  height: 14px;
  background: #fff;
  color: #000;
  font-weight: 800;
  font-size: 12px;
  letter-spacing: 0.06em;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  border-radius: 4px;
}

.right-column {
  justify-content: flex-end;
}

.drum-machine-shell :deep(.right-column) {
  justify-content: flex-end;
}

.pads-and-strip {
  --pads-square-size: clamp(320px, 42vh, 520px);
  --pad-cell-size: calc(var(--pads-square-size) / 4);
  align-items: end;
  grid-template-columns: clamp(90px, 18%, 140px) minmax(0, 1fr);
}

.drum-machine-shell :deep(.pads-and-strip) {
  --pads-square-size: clamp(320px, 42vh, 520px);
  --pad-cell-size: calc(var(--pads-square-size) / 4);
  align-items: end;
  grid-template-columns: clamp(90px, 18%, 140px) minmax(0, 1fr);
}

.pad-top-buttons {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: @space-xxs;
  width: 100%;
  margin-bottom: @space-xs;
}

.pads-column {
  grid-area: pads;
  align-self: end;
}

.mode-buttons {
  grid-area: strip;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: repeat(8, 1fr);
  gap: @space-xxs;
  align-self: end;
  height: var(--pads-square-size);
}

.drum-machine-shell :deep(.mode-buttons) {
  grid-area: strip;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: repeat(8, 1fr);
  gap: @space-xxs;
  align-self: end;
  height: var(--pads-square-size);
}

.mode-buttons .control-btn {
  min-height: calc(var(--pad-cell-size) * 2);
}

.drum-machine-shell :deep(.mode-buttons .control-btn) {
  min-height: calc(var(--pad-cell-size) * 2);
}

.pads-stack {
  align-self: end;
}

.drum-machine-shell :deep(.pads-stack) {
  align-self: end;
}

.pads-square {
  max-width: var(--pads-square-size);
  aspect-ratio: 1 / 1;
}

.drum-machine-shell :deep(.pads-square) {
  max-width: var(--pads-square-size);
  aspect-ratio: 1 / 1;
}

.pad-grid-indicator {
  overflow: visible;
}

.drum-machine-shell :deep(.pad-grid-indicator) {
  overflow: visible;
}

.drawer-shell :deep([data-tab='fx']),
.drawer-shell :deep(.fx-panel) {
  display: none !important;
}

</style>
