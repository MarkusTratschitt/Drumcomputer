import { defineStore } from 'pinia'
import { markRaw, type Raw } from 'vue'
import { use4DEncoder, type EncoderField, type Use4DEncoderReturn } from '../composables/use4DEncoder'
import { useBrowserStore, type BrowserFilters } from './browser'

export type ControlMode =
  | 'CHANNEL'
  | 'PLUGIN'
  | 'ARRANGER'
  | 'MIXER'
  | 'BROWSER'
  | 'SAMPLING'
  | 'FILE'
  | 'SETTINGS'
  | 'AUTO'
  | 'MACRO'

type SoftButton = {
  label: string
  actionId: string
  shiftLabel?: string | undefined
  shiftActionId?: string | undefined
  enabled: boolean
  description?: string | undefined
}

type EncoderParam = {
  id: string
  name: string
  value: number
  min: number
  max: number
  step: number
  fineStep?: number
  format?: string
  side?: 'left' | 'right'
}

type ListItem = {
  title: string
  subtitle?: string
  active?: boolean
  value?: string
  meter?: number
}

type DisplayPanelModel = {
  view:
  | 'BROWSER'
  | 'FILE'
  | 'SETTINGS'
  | 'SAMPLING'
  | 'MIXER'
  | 'ARRANGER'
  | 'INFO'
  | 'EMPTY'
  title?: string
  summary?: string
  items?: ListItem[]
  hint?: string
}

type ControlPage = {
  label: string
  softButtons: SoftButton[]
  params: EncoderParam[]
  leftModel: DisplayPanelModel
  rightModel: DisplayPanelModel
}

type PageIndexByMode = Record<ControlMode, number>

const MODES: ControlMode[] = [
  'CHANNEL',
  'PLUGIN',
  'ARRANGER',
  'MIXER',
  'BROWSER',
  'SAMPLING',
  'FILE',
  'SETTINGS',
  'AUTO',
  'MACRO'
]

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value))

const formatRelativeTimestamp = (timestamp: number): string => {
  const now = Date.now()
  const diffMs = Math.max(0, now - timestamp)
  const minuteMs = 60 * 1000
  const hourMs = 60 * minuteMs
  const dayMs = 24 * hourMs
  if (diffMs < minuteMs) return 'gerade'
  if (diffMs < hourMs) {
    const minutes = Math.floor(diffMs / minuteMs)
    return `vor ${minutes} Minute${minutes === 1 ? '' : 'n'}`
  }
  const nowDate = new Date(now)
  const entryDate = new Date(timestamp)
  const sameDay =
    nowDate.getFullYear() === entryDate.getFullYear() &&
    nowDate.getMonth() === entryDate.getMonth() &&
    nowDate.getDate() === entryDate.getDate()
  if (sameDay) return 'heute'
  const days = Math.floor(diffMs / dayMs)
  if (days === 1) return 'gestern'
  return `vor ${Math.max(2, days)} Tagen`
}

const parseFieldValueForFilter = (field: EncoderField): BrowserFilters[keyof BrowserFilters] => {
  if (field.id === 'favorites') {
    return String(field.value) === 'on'
  }
  if (field.id === 'tags') {
    if (typeof field.value !== 'string') return []
    const tags = field.value
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)
    return tags
  }
  if (typeof field.value === 'number') {
    return String(field.value)
  }
  return field.value as BrowserFilters[keyof BrowserFilters]
}

const parseSortMode = (value: EncoderField['value']): 'name-asc' | 'name-desc' | 'date-asc' | 'date-desc' | 'relevance' => {
  const label = String(value)
  if (label.includes('Name ↑')) return 'name-asc'
  if (label.includes('Name ↓')) return 'name-desc'
  if (label.includes('Date ↑')) return 'date-asc'
  if (label.includes('Date ↓')) return 'date-desc'
  return 'relevance'
}

const buildSoftButtons = (buttons: Partial<SoftButton>[]): SoftButton[] => {
  const defaults: SoftButton = {
    label: '',
    actionId: 'noop',
    enabled: false,
    description: undefined
  }
  const filled = buttons.map((btn) => ({
    ...defaults,
    ...btn,
    enabled: btn.enabled !== false
  }))
  while (filled.length < 8) {
    filled.push({ ...defaults })
  }
  return filled.slice(0, 8)
}

const buildParams = (params: Partial<EncoderParam>[]): EncoderParam[] => {
  const defaults: EncoderParam = {
    id: 'param',
    name: '',
    value: 0,
    min: 0,
    max: 127,
    step: 1,
    side: 'left'
  }
  const filled = params.map((param, index) => ({
    ...defaults,
    id: param.id ?? `param-${index + 1}`,
    name: param.name ?? `Param ${index + 1}`,
    ...param
  }))
  while (filled.length < 8) {
    const idx = filled.length + 1
    filled.push({ ...defaults, id: `param-${idx}`, name: `Param ${idx}`, side: idx <= 4 ? 'left' : 'right' })
  }
  return filled.slice(0, 8)
}

const buildPreviewParams = (): EncoderParam[] =>
  buildParams([
    { id: 'preview-vol', name: 'Preview Vol', value: 80, min: 0, max: 100, step: 1 },
    { id: 'preview-start', name: 'Start', value: 0, min: 0, max: 100, step: 1 },
    { id: 'preview-end', name: 'End', value: 100, min: 0, max: 100, step: 1 },
    { id: 'preview-tune', name: 'Tune', value: 0, min: -12, max: 12, step: 1 }
  ])

const browserPages: ControlPage[] = [
  {
    label: 'Library',
    softButtons: buildSoftButtons([
      { label: 'Search', actionId: 'BROWSER_SEARCH', shiftLabel: 'Plug-In Menu', shiftActionId: 'BROWSER_PLUGIN_MENU' },
      { label: 'Type', actionId: 'BROWSER_TYPE' },
      { label: 'Tag', actionId: 'BROWSER_TAG' },
      { label: 'Favorites', actionId: 'BROWSER_FAVORITES' },
      { label: 'Prehear', actionId: 'BROWSER_PREHEAR', shiftLabel: 'Stop', shiftActionId: 'BROWSER_STOP' },
      { label: 'Load', actionId: 'BROWSER_LOAD' },
      { label: 'Import', actionId: 'BROWSER_IMPORT_TO_PAD', description: 'Import to selected pad (Ctrl+Enter)' },
      { label: 'Clear', actionId: 'BROWSER_CLEAR' }
    ]),
    params: buildParams([
      { id: 'filter1', name: 'Filter', value: 40, min: 0, max: 100, step: 2, format: '%' },
      { id: 'cutoff', name: 'Cutoff', value: 72, min: 0, max: 127, step: 3 },
      { id: 'res', name: 'Resonance', value: 32, min: 0, max: 127, step: 3 },
      { id: 'rate', name: 'Rate', value: 4, min: 1, max: 16, step: 1 },
      { id: 'depth', name: 'Depth', value: 25, min: 0, max: 100, step: 1, side: 'right' },
      { id: 'space', name: 'Space', value: 35, min: 0, max: 100, step: 1, side: 'right' },
      { id: 'tone', name: 'Tone', value: 64, min: 0, max: 127, step: 2, side: 'right' },
      { id: 'volume', name: 'Volume', value: 90, min: 0, max: 127, step: 2, side: 'right' }
    ]),
    leftModel: {
      view: 'BROWSER',
      title: 'Browser',
      summary: 'Navigate library',
      items: [
        { title: 'Drums', subtitle: 'Kits, Percussion', active: true },
        { title: 'Instruments', subtitle: 'Bass, Keys' },
        { title: 'Loops', subtitle: 'Textures' },
        { title: 'User', subtitle: 'Local content' }
      ],
      hint: 'SHIFT: Plug-in menu'
    },
    rightModel: {
      view: 'BROWSER',
      title: 'Results',
      items: [
        { title: 'Neon Kit', subtitle: 'Kit • 16 samples', active: true },
        { title: 'Marble Kit', subtitle: 'Kit • 16 samples' },
        { title: 'Dusty Breaks', subtitle: 'Loop • 92 BPM' },
        { title: 'Glass Pluck', subtitle: 'Instrument' }
      ],
      summary: 'Use Load or Replace'
    }
  },
  {
    label: 'Recent',
    softButtons: buildSoftButtons([
      { label: 'Recent', actionId: 'BROWSER_RECENT' },
      { label: 'Clear', actionId: 'BROWSER_CLEAR_RECENT' },
      { label: 'Fav', actionId: 'BROWSER_FAVORITE' },
      { label: 'Tag', actionId: 'BROWSER_TAG_RECENT' },
      { label: 'Load', actionId: 'BROWSER_LOAD_RECENT' },
      { label: 'Prehear', actionId: 'BROWSER_PREHEAR' },
      { label: 'Replace', actionId: 'BROWSER_REPLACE' },
      { label: 'Stop', actionId: 'BROWSER_STOP' }
    ]),
    params: buildParams([
      { id: 'recent-volume', name: 'Preview Vol', value: 68, min: 0, max: 127, step: 2 },
      { id: 'recent-start', name: 'Start', value: 0, min: 0, max: 100, step: 1 },
      { id: 'recent-end', name: 'End', value: 100, min: 0, max: 100, step: 1 },
      { id: 'recent-tune', name: 'Tune', value: 64, min: 0, max: 127, step: 1 },
      { id: 'recent-form', name: 'Formant', value: 64, min: 0, max: 127, step: 1, side: 'right' },
      { id: 'recent-pan', name: 'Pan', value: 64, min: 0, max: 127, step: 1, side: 'right' },
      { id: 'recent-dry', name: 'Dry/Wet', value: 80, min: 0, max: 127, step: 2, side: 'right' },
      { id: 'recent-level', name: 'Level', value: 90, min: 0, max: 127, step: 2, side: 'right' }
    ]),
    leftModel: {
      view: 'BROWSER',
      title: 'Recent Files',
      items: [
        { title: 'Deep Snare', subtitle: 'Sample', active: true },
        { title: 'Air Hat', subtitle: 'Sample' },
        { title: 'Chop Vox', subtitle: 'Sample' },
        { title: 'Lo-fi Loop', subtitle: 'Loop • 87 BPM' }
      ]
    },
    rightModel: {
      view: 'BROWSER',
      title: 'Preview',
      summary: 'Use Prehear',
      items: [
        { title: 'Waveform', subtitle: '00:12', value: 'Fade-in' },
        { title: 'Slice Points', subtitle: 'Auto • 8' }
      ]
    }
  }
]

const channelPages: ControlPage[] = [
  {
    label: 'Levels',
    softButtons: buildSoftButtons([
      { label: 'Sound', actionId: 'CHANNEL_SOUND' },
      { label: 'Group', actionId: 'CHANNEL_GROUP' },
      { label: 'Master', actionId: 'CHANNEL_MASTER' },
      { label: 'Input', actionId: 'CHANNEL_INPUT' },
      { label: 'Route', actionId: 'CHANNEL_ROUTE' },
      { label: 'Solo', actionId: 'CHANNEL_SOLO' },
      { label: 'Mute', actionId: 'CHANNEL_MUTE' },
      { label: 'Monitor', actionId: 'CHANNEL_MONITOR' }
    ]),
    params: buildParams([
      { id: 'snd-level', name: 'Sound Vol', value: 96, min: 0, max: 127, step: 2 },
      { id: 'snd-pan', name: 'Sound Pan', value: 64, min: 0, max: 127, step: 2 },
      { id: 'snd-send-a', name: 'Send A', value: 40, min: 0, max: 127, step: 2 },
      { id: 'snd-send-b', name: 'Send B', value: 55, min: 0, max: 127, step: 2 },
      { id: 'grp-level', name: 'Group Vol', value: 88, min: 0, max: 127, step: 2, side: 'right' },
      { id: 'grp-pan', name: 'Group Pan', value: 64, min: 0, max: 127, step: 2, side: 'right' },
      { id: 'mst-comp', name: 'Master Comp', value: 48, min: 0, max: 127, step: 2, side: 'right' },
      { id: 'mst-lim', name: 'Limiter', value: 38, min: 0, max: 127, step: 1, side: 'right' }
    ]),
    leftModel: {
      view: 'MIXER',
      title: 'Channel Levels',
      items: [
        { title: 'Kick', value: '-1.2 dB', meter: 0.84 },
        { title: 'Snare', value: '-3.1 dB', meter: 0.68 },
        { title: 'Hat', value: '-5.0 dB', meter: 0.54 },
        { title: 'Bass', value: '-0.4 dB', meter: 0.9 }
      ],
      summary: 'SHIFT: MIDI'
    },
    rightModel: {
      view: 'MIXER',
      title: 'Group & Master',
      items: [
        { title: 'Group A', value: '-1.0 dB', meter: 0.82 },
        { title: 'Group B', value: '-2.4 dB', meter: 0.72 },
        { title: 'Master', value: '-0.3 dB', meter: 0.96 }
      ]
    }
  }
]

const pluginPages: ControlPage[] = [
  {
    label: 'Plug-in',
    softButtons: buildSoftButtons([
      { label: 'Instance', actionId: 'PLUGIN_INSTANCE', shiftLabel: 'Swap', shiftActionId: 'PLUGIN_SWAP' },
      { label: 'Preset', actionId: 'PLUGIN_PRESET' },
      { label: 'Bypass', actionId: 'PLUGIN_BYPASS' },
      { label: 'Enable', actionId: 'PLUGIN_ENABLE' },
      { label: 'Param', actionId: 'PLUGIN_PARAM' },
      { label: 'Macro', actionId: 'PLUGIN_MACRO' },
      { label: 'Browse', actionId: 'PLUGIN_BROWSE' },
      { label: 'Remove', actionId: 'PLUGIN_REMOVE' }
    ]),
    params: buildParams([
      { id: 'cutoff', name: 'Cutoff', value: 82, min: 0, max: 127, step: 2 },
      { id: 'resonance', name: 'Resonance', value: 52, min: 0, max: 127, step: 2 },
      { id: 'attack', name: 'Attack', value: 12, min: 0, max: 127, step: 1 },
      { id: 'release', name: 'Release', value: 88, min: 0, max: 127, step: 2 },
      { id: 'drive', name: 'Drive', value: 40, min: 0, max: 127, step: 2, side: 'right' },
      { id: 'mix', name: 'Mix', value: 90, min: 0, max: 127, step: 2, side: 'right' },
      { id: 'width', name: 'Stereo', value: 70, min: 0, max: 127, step: 2, side: 'right' },
      { id: 'out', name: 'Output', value: 96, min: 0, max: 127, step: 2, side: 'right' }
    ]),
    leftModel: {
      view: 'INFO',
      title: 'Plug-In Chain',
      items: [
        { title: 'Slot 1', subtitle: 'Drum Synth', active: true },
        { title: 'Slot 2', subtitle: 'Transient Master' },
        { title: 'Slot 3', subtitle: 'Reverb' }
      ]
    },
    rightModel: {
      view: 'INFO',
      title: 'Instance',
      summary: 'SHIFT: Swap instance',
      items: [
        { title: 'Preset', subtitle: 'Neon Dust' },
        { title: 'Category', subtitle: 'Drums' },
        { title: 'Author', subtitle: 'Native Instruments' }
      ]
    }
  }
]

const arrangerPages: ControlPage[] = [
  {
    label: 'Scenes',
    softButtons: buildSoftButtons([
      { label: 'Scenes', actionId: 'ARRANGER_SCENES' },
      { label: 'Sections', actionId: 'ARRANGER_SECTIONS' },
      { label: 'Duplicate', actionId: 'ARRANGER_DUPLICATE' },
      { label: 'Length', actionId: 'ARRANGER_LENGTH' },
      { label: 'Follow', actionId: 'ARRANGER_FOLLOW' },
      { label: 'Loop', actionId: 'ARRANGER_LOOP' },
      { label: 'Grid', actionId: 'ARRANGER_GRID' },
      { label: 'Clear', actionId: 'ARRANGER_CLEAR' }
    ]),
    params: buildParams([
      { id: 'scene-length', name: 'Scene Bars', value: 4, min: 1, max: 16, step: 1 },
      { id: 'scene-repeat', name: 'Repeat', value: 2, min: 1, max: 8, step: 1 },
      { id: 'section', name: 'Section', value: 1, min: 1, max: 16, step: 1 },
      { id: 'swing', name: 'Swing', value: 8, min: 0, max: 100, step: 1 },
      { id: 'velocity', name: 'Vel Mod', value: 50, min: 0, max: 127, step: 2, side: 'right' },
      { id: 'humanize', name: 'Humanize', value: 24, min: 0, max: 127, step: 2, side: 'right' },
      { id: 'shift', name: 'Shift', value: 0, min: -32, max: 32, step: 1, side: 'right' },
      { id: 'accent', name: 'Accent', value: 72, min: 0, max: 127, step: 2, side: 'right' }
    ]),
    leftModel: {
      view: 'ARRANGER',
      title: 'Scenes',
      items: [
        { title: 'Intro', subtitle: '4 bars', active: true },
        { title: 'Hook', subtitle: '8 bars' },
        { title: 'Bridge', subtitle: '4 bars' },
        { title: 'Outro', subtitle: '4 bars' }
      ],
      summary: 'Page ◀/▶ for parameters'
    },
    rightModel: {
      view: 'ARRANGER',
      title: 'Layout',
      items: [
        { title: 'Pattern A1', subtitle: 'Scene: Intro' },
        { title: 'Pattern B1', subtitle: 'Scene: Hook' },
        { title: 'Pattern C1', subtitle: 'Scene: Bridge' }
      ]
    }
  }
]

const mixerPages: ControlPage[] = [
  {
    label: 'Mix',
    softButtons: buildSoftButtons([
      { label: 'Levels', actionId: 'MIXER_LEVELS' },
      { label: 'Pan', actionId: 'MIXER_PAN' },
      { label: 'Sends', actionId: 'MIXER_SENDS' },
      { label: 'FX', actionId: 'MIXER_FX' },
      { label: 'Group', actionId: 'MIXER_GROUP' },
      { label: 'Master', actionId: 'MIXER_MASTER' },
      { label: 'Cue', actionId: 'MIXER_CUE' },
      { label: 'Meters', actionId: 'MIXER_METERS' }
    ]),
    params: buildParams([
      { id: 'kick-level', name: 'Kick', value: 96, min: 0, max: 127, step: 2 },
      { id: 'snare-level', name: 'Snare', value: 92, min: 0, max: 127, step: 2 },
      { id: 'hat-level', name: 'Hat', value: 88, min: 0, max: 127, step: 2 },
      { id: 'perc-level', name: 'Perc', value: 80, min: 0, max: 127, step: 2 },
      { id: 'bus-comp', name: 'Bus Comp', value: 50, min: 0, max: 127, step: 2, side: 'right' },
      { id: 'bus-sat', name: 'Saturate', value: 36, min: 0, max: 127, step: 2, side: 'right' },
      { id: 'send-a', name: 'Send A', value: 45, min: 0, max: 127, step: 2, side: 'right' },
      { id: 'send-b', name: 'Send B', value: 56, min: 0, max: 127, step: 2, side: 'right' }
    ]),
    leftModel: {
      view: 'MIXER',
      title: 'Channels',
      items: [
        { title: 'Kick', value: '-1.2 dB', meter: 0.84 },
        { title: 'Snare', value: '-3.0 dB', meter: 0.72 },
        { title: 'Hat', value: '-4.4 dB', meter: 0.62 }
      ]
    },
    rightModel: {
      view: 'MIXER',
      title: 'Sends/FX',
      items: [
        { title: 'Reverb', subtitle: 'Aux A', value: '22%' },
        { title: 'Delay', subtitle: 'Aux B', value: '18%' },
        { title: 'Sidechain', subtitle: 'Bus', value: '-14 dB' }
      ]
    }
  }
]

const samplingPages: ControlPage[] = [
  {
    label: 'Sampling',
    softButtons: buildSoftButtons([
      { label: 'Record', actionId: 'SAMPLING_RECORD' },
      { label: 'Edit', actionId: 'SAMPLING_EDIT' },
      { label: 'Slice', actionId: 'SAMPLING_SLICE' },
      { label: 'Detect', actionId: 'SAMPLING_DETECT' },
      { label: 'Normalize', actionId: 'SAMPLING_NORMALIZE' },
      { label: 'Fade', actionId: 'SAMPLING_FADE' },
      { label: 'Apply', actionId: 'SAMPLING_APPLY' },
      { label: 'Discard', actionId: 'SAMPLING_DISCARD' }
    ]),
    params: buildParams([
      { id: 'start', name: 'Start', value: 0, min: 0, max: 100, step: 1 },
      { id: 'end', name: 'End', value: 100, min: 0, max: 100, step: 1 },
      { id: 'snap', name: 'Snap', value: 1, min: 0, max: 8, step: 1 },
      { id: 'silence', name: 'Silence', value: 6, min: 0, max: 20, step: 1 },
      { id: 'attack', name: 'Attack', value: 4, min: 0, max: 127, step: 1, side: 'right' },
      { id: 'hold', name: 'Hold', value: 32, min: 0, max: 127, step: 1, side: 'right' },
      { id: 'release', name: 'Release', value: 60, min: 0, max: 127, step: 2, side: 'right' },
      { id: 'gain', name: 'Gain', value: 80, min: 0, max: 127, step: 2, side: 'right' }
    ]),
    leftModel: {
      view: 'SAMPLING',
      title: 'Waveform',
      summary: 'Set start/end or slice',
      items: [
        { title: 'Length', value: '0:12.4' },
        { title: 'Slices', value: '8 auto' }
      ]
    },
    rightModel: {
      view: 'SAMPLING',
      title: 'Actions',
      items: [
        { title: 'Record Input', subtitle: 'Line' },
        { title: 'Monitor', subtitle: 'On' },
        { title: 'Normalize', subtitle: '-1 dB' }
      ]
    }
  }
]

const filePages: ControlPage[] = [
  {
    label: 'Files',
    softButtons: buildSoftButtons([
      { label: 'New', actionId: 'FILE_NEW' },
      { label: 'Open', actionId: 'FILE_OPEN' },
      { label: 'Save', actionId: 'FILE_SAVE', shiftLabel: 'Save As', shiftActionId: 'FILE_SAVE_AS' },
      { label: 'Export', actionId: 'FILE_EXPORT' },
      { label: 'Audio', actionId: 'FILE_EXPORT_AUDIO' },
      { label: 'MIDI', actionId: 'FILE_EXPORT_MIDI' },
      { label: 'Bounce', actionId: 'FILE_BOUNCE' },
      { label: 'Close', actionId: 'FILE_CLOSE' }
    ]),
    params: buildParams([
      { id: 'mixdown', name: 'Mixdown', value: 0, min: 0, max: 1, step: 1 },
      { id: 'stems', name: 'Stems', value: 1, min: 0, max: 1, step: 1 },
      { id: 'normalize', name: 'Normalize', value: 1, min: 0, max: 1, step: 1 },
      { id: 'dither', name: 'Dither', value: 0, min: 0, max: 1, step: 1 },
      { id: 'sample-rate', name: 'Rate', value: 48000, min: 22050, max: 96000, step: 11025, side: 'right' },
      { id: 'bit-depth', name: 'Bit', value: 24, min: 8, max: 32, step: 8, side: 'right' },
      { id: 'loop-export', name: 'Loop', value: 1, min: 0, max: 1, step: 1, side: 'right' },
      { id: 'prepend', name: 'Count-in', value: 1, min: 0, max: 1, step: 1, side: 'right' }
    ]),
    leftModel: {
      view: 'FILE',
      title: 'File Ops',
      items: [
        { title: 'New Project', subtitle: 'Empty template' },
        { title: 'Open Recent', subtitle: 'DrumComputer_01' },
        { title: 'Save', subtitle: 'CTRL+S', active: true }
      ],
      summary: 'SHIFT: Save As'
    },
    rightModel: {
      view: 'FILE',
      title: 'Export',
      items: [
        { title: 'Audio', subtitle: 'Mixdown, Stems' },
        { title: 'MIDI', subtitle: 'All tracks' },
        { title: 'Bounce', subtitle: 'Selected pattern' }
      ],
      summary: 'Count-in & loop options'
    }
  }
]

const settingsPages: ControlPage[] = [
  {
    label: 'Settings',
    softButtons: buildSoftButtons([
      { label: 'Metronome', actionId: 'SETTINGS_METRO' },
      { label: 'Count-In', actionId: 'SETTINGS_COUNTIN' },
      { label: 'Quantize', actionId: 'SETTINGS_QUANTIZE' },
      { label: 'MIDI', actionId: 'SETTINGS_MIDI' },
      { label: 'Audio', actionId: 'SETTINGS_AUDIO' },
      { label: 'Theme', actionId: 'SETTINGS_THEME' },
      { label: 'Safe', actionId: 'SETTINGS_SAFE' },
      { label: 'Reset', actionId: 'SETTINGS_RESET' }
    ]),
    params: buildParams([
      { id: 'metro-lvl', name: 'Metro Vol', value: 72, min: 0, max: 127, step: 2 },
      { id: 'count-in', name: 'Count-In', value: 1, min: 0, max: 8, step: 1 },
      { id: 'swing', name: 'Swing', value: 8, min: 0, max: 100, step: 1 },
      { id: 'quantize', name: 'Quantize', value: 1, min: 0, max: 1, step: 1 },
      { id: 'theme', name: 'Theme', value: 0, min: 0, max: 2, step: 1, side: 'right' },
      { id: 'audio-lat', name: 'Latency', value: 5, min: 1, max: 20, step: 1, side: 'right' },
      { id: 'buffer', name: 'Buffer', value: 256, min: 64, max: 1024, step: 64, side: 'right' },
      { id: 'safety', name: 'Safe Mode', value: 1, min: 0, max: 1, step: 1, side: 'right' }
    ]),
    leftModel: {
      view: 'SETTINGS',
      title: 'System',
      items: [
        { title: 'Metronome', value: 'On' },
        { title: 'Count-In', value: '1 bar' },
        { title: 'Quantize', value: '1/16' }
      ]
    },
    rightModel: {
      view: 'SETTINGS',
      title: 'Audio/MIDI',
      items: [
        { title: 'Device', subtitle: 'Built-in Output' },
        { title: 'Buffer', subtitle: '256 samples' },
        { title: 'MIDI Input', subtitle: 'MK3 Virtual' }
      ]
    }
  }
]

const autoPages: ControlPage[] = [
  {
    label: 'Automation',
    softButtons: buildSoftButtons([
      { label: 'Write', actionId: 'AUTO_WRITE' },
      { label: 'Read', actionId: 'AUTO_READ' },
      { label: 'Latch', actionId: 'AUTO_LATCH' },
      { label: 'Touch', actionId: 'AUTO_TOUCH' },
      { label: 'Erase', actionId: 'AUTO_ERASE' },
      { label: 'Arm', actionId: 'AUTO_ARM' },
      { label: 'Hold', actionId: 'AUTO_HOLD' },
      { label: 'Clear', actionId: 'AUTO_CLEAR' }
    ]),
    params: buildParams([
      { id: 'auto-lane', name: 'Lane', value: 1, min: 1, max: 8, step: 1 },
      { id: 'auto-smooth', name: 'Smooth', value: 42, min: 0, max: 127, step: 2 },
      { id: 'auto-scale', name: 'Scale', value: 100, min: 0, max: 150, step: 5 },
      { id: 'auto-quant', name: 'Quantize', value: 1, min: 0, max: 1, step: 1 },
      { id: 'auto-protect', name: 'Protect', value: 0, min: 0, max: 1, step: 1, side: 'right' },
      { id: 'auto-loop', name: 'Loop', value: 1, min: 0, max: 1, step: 1, side: 'right' },
      { id: 'auto-snap', name: 'Snap', value: 1, min: 0, max: 1, step: 1, side: 'right' },
      { id: 'auto-depth', name: 'Depth', value: 60, min: 0, max: 127, step: 2, side: 'right' }
    ]),
    leftModel: {
      view: 'INFO',
      title: 'Automation',
      summary: 'Hold to write with encoders',
      items: [
        { title: 'Mode', value: 'Write' },
        { title: 'Lane', value: '1/8 Grid' }
      ]
    },
    rightModel: {
      view: 'INFO',
      title: 'Status',
      items: [
        { title: 'Armed', value: 'Yes' },
        { title: 'Protect', value: 'Off' },
        { title: 'Overwrite', value: 'No' }
      ]
    }
  }
]

const macroPages: ControlPage[] = [
  {
    label: 'Macro',
    softButtons: buildSoftButtons([
      { label: 'Assign', actionId: 'MACRO_ASSIGN' },
      { label: 'Clear', actionId: 'MACRO_CLEAR' },
      { label: 'Hold', actionId: 'MACRO_HOLD' },
      { label: 'Latch', actionId: 'MACRO_LATCH' },
      { label: 'Morph', actionId: 'MACRO_MORPH' },
      { label: 'Set', actionId: 'MACRO_SET', shiftLabel: 'Shift Set', shiftActionId: 'MACRO_SHIFT_SET' },
      { label: 'Store', actionId: 'MACRO_STORE' },
      { label: 'Recall', actionId: 'MACRO_RECALL' }
    ]),
    params: buildParams([
      { id: 'macro1', name: 'Macro 1', value: 40, min: 0, max: 127, step: 2 },
      { id: 'macro2', name: 'Macro 2', value: 80, min: 0, max: 127, step: 2 },
      { id: 'macro3', name: 'Macro 3', value: 64, min: 0, max: 127, step: 2 },
      { id: 'macro4', name: 'Macro 4', value: 32, min: 0, max: 127, step: 2 },
      { id: 'macro5', name: 'Macro 5', value: 20, min: 0, max: 127, step: 2, side: 'right' },
      { id: 'macro6', name: 'Macro 6', value: 55, min: 0, max: 127, step: 2, side: 'right' },
      { id: 'macro7', name: 'Macro 7', value: 76, min: 0, max: 127, step: 2, side: 'right' },
      { id: 'macro8', name: 'Macro 8', value: 90, min: 0, max: 127, step: 2, side: 'right' }
    ]),
    leftModel: {
      view: 'INFO',
      title: 'Macro Sets',
      items: [
        { title: 'Set A', subtitle: 'Live' },
        { title: 'Set B', subtitle: 'Studio', active: true },
        { title: 'Set C', subtitle: 'User' }
      ],
      summary: 'SHIFT: Macro Set'
    },
    rightModel: {
      view: 'INFO',
      title: 'Morph',
      items: [
        { title: 'Target', subtitle: 'Set B' },
        { title: 'Morph', value: '38%' }
      ]
    }
  }
]

const pagesByMode: Record<ControlMode, ControlPage[]> = {
  CHANNEL: channelPages,
  PLUGIN: pluginPages,
  ARRANGER: arrangerPages,
  MIXER: mixerPages,
  BROWSER: browserPages,
  SAMPLING: samplingPages,
  FILE: filePages,
  SETTINGS: settingsPages,
  AUTO: autoPages,
  MACRO: macroPages
}

const createInitialPageIndex = (): PageIndexByMode => {
  return MODES.reduce((acc, mode) => {
    acc[mode] = 0
    return acc
  }, {} as PageIndexByMode)
}

export const useControlStore = defineStore('control', {
  state: () => ({
    activeMode: 'BROWSER' as ControlMode,
    shiftHeld: false,
    pageIndexByMode: createInitialPageIndex(),
    pagesByMode,
    lastAction: 'Ready',
    statusFlags: {
      metronome: true,
      countIn: true,
      automationArmed: false
    },
    encoder4D: null as Raw<Use4DEncoderReturn> | null,
    browserDisplay: null as { leftModel: DisplayPanelModel; rightModel: DisplayPanelModel } | null
  }),
  getters: {
    activePage(state): ControlPage {
      const pages = state.pagesByMode[state.activeMode] ?? []
      const index = state.pageIndexByMode[state.activeMode] ?? 0
      return pages[index] ?? pages[0]
    },
    pageLabel(): string {
      return this.activePage?.label ?? ''
    },
    modeTitle(state): string {
      return state.activeMode
    },
    activeSoftButtons(): SoftButton[] {
      return this.activePage?.softButtons ?? buildSoftButtons([])
    },
    softLabels(): string[] {
      return this.activeSoftButtons.map((btn) => btn.label || '')
    },
    activeParams(): EncoderParam[] {
      if (this.activeMode === 'BROWSER') {
        const browser = useBrowserStore()
        if (browser.previewState.isPlaying) {
          return buildPreviewParams()
        }
      }
      return this.activePage?.params ?? buildParams([])
    },
    paramSlotsLeft(): EncoderParam[] {
      return this.activeParams.filter((param) => (param.side ?? 'left') === 'left').slice(0, 4)
    },
    paramSlotsRight(): EncoderParam[] {
      return this.activeParams.filter((param) => (param.side ?? 'left') === 'right').slice(0, 4)
    },
    leftModel(): DisplayPanelModel {
      if ((this.activeMode === 'BROWSER' || this.activeMode === 'FILE') && this.browserDisplay?.leftModel) {
        return this.browserDisplay.leftModel
      }
      return this.activePage?.leftModel ?? { view: 'EMPTY', title: 'Empty' }
    },
    rightModel(): DisplayPanelModel {
      if ((this.activeMode === 'BROWSER' || this.activeMode === 'FILE') && this.browserDisplay?.rightModel) {
        return this.browserDisplay.rightModel
      }
      return this.activePage?.rightModel ?? { view: 'EMPTY', title: 'Empty' }
    }
  },
  actions: {
    initEncoderForBrowser() {
      const browser = useBrowserStore()
      const encoder = this.encoder4D ?? markRaw(use4DEncoder())
      this.encoder4D = encoder
      const fields = browser.getEncoderFields()
      encoder.setFields(fields)
      encoder.setMode('field-select')
      encoder.activeListIndex.value = 0
    },
    refreshEncoderFields() {
      if (!this.encoder4D) return
      const browser = useBrowserStore()
      this.encoder4D.setFields(browser.getEncoderFields())
    },
    syncBrowserDisplay() {
      const browser = useBrowserStore()
      if (browser.tagDialogOpen) {
        if (this.encoder4D) {
          const fields = browser.getEncoderFields()
          this.encoder4D.setFields(fields)
          this.encoder4D.setMode('list-navigate')
          if (fields.length === 0) {
            this.encoder4D.activeListIndex.value = 0
          } else {
            const index = clamp(this.encoder4D.activeListIndex.value, 0, fields.length - 1)
            this.encoder4D.activeListIndex.value = index
          }
        }
        this.setBrowserDisplay(browser.toDisplayModels())
        return
      }
      if (this.activeMode === 'BROWSER' && this.activePage?.label === 'Recent') {
        browser.loadRecentFiles()
        const recentItems = browser.recentFiles.map((entry) => ({
          title: entry.name,
          subtitle: formatRelativeTimestamp(entry.timestamp),
          value: entry.id
        }))
        this.setBrowserDisplay({
          leftModel: {
            view: 'BROWSER',
            title: 'Recent Files',
            summary: `${recentItems.length} items`,
            items: recentItems
          },
          rightModel: this.activePage?.rightModel ?? { view: 'BROWSER', title: 'Preview' }
        })
        return
      }
      const models = browser.toDisplayModels()
      if (this.encoder4D) {
        const activeField = this.encoder4D.activeField.value
        if (activeField) {
          const summary = models.leftModel.summary ?? ''
          const highlight = `(${activeField.label})`
          models.leftModel = {
            ...models.leftModel,
            summary: [summary, highlight].filter((value) => value && value.length > 0).join(' ')
          }
        }
      }
      this.setBrowserDisplay(models)
    },
    syncListSelection() {
      if (!this.encoder4D) return
      const browser = useBrowserStore()
      if (this.activeMode === 'FILE') {
        const files = browser.files.entries.files
        if (files.length === 0) {
          browser.selectPath(null)
          this.encoder4D.activeListIndex.value = 0
        } else {
          const index = clamp(this.encoder4D.activeListIndex.value, 0, files.length - 1)
          this.encoder4D.activeListIndex.value = index
          browser.selectPath(files[index]?.path ?? null)
        }
      } else {
        const results = browser.library.results
        if (results.length === 0) {
          browser.selectResult(null)
          this.encoder4D.activeListIndex.value = 0
        } else {
          const index = clamp(this.encoder4D.activeListIndex.value, 0, results.length - 1)
          this.encoder4D.activeListIndex.value = index
          browser.selectResult(results[index]?.id ?? null)
        }
      }
      this.syncBrowserDisplay()
    },
    applyEncoderFieldFilter() {
      if (!this.encoder4D) return
      const browser = useBrowserStore()
      const field = this.encoder4D.activeField.value
      if (!field) return
      if (field.id === 'sort') {
        browser.setSortMode(parseSortMode(field.value))
        this.refreshEncoderFields()
        return
      }
      const value = parseFieldValueForFilter(field)
      browser.setFilter(field.id as keyof BrowserFilters, value as BrowserFilters[keyof BrowserFilters])
      this.refreshEncoderFields()
    },
    setMode(mode: ControlMode) {
      this.activeMode = mode
      if (this.pageIndexByMode[mode] == null) {
        this.pageIndexByMode[mode] = 0
      }
      this.lastAction = `${mode} selected`
      if (mode === 'BROWSER' || mode === 'FILE') {
        this.initEncoderForBrowser()
        this.syncBrowserDisplay()
      }
    },
    setShiftHeld(value: boolean) {
      this.shiftHeld = value
    },
    setBrowserDisplay(models: { leftModel: DisplayPanelModel; rightModel: DisplayPanelModel } | null) {
      this.browserDisplay = models
    },
    nextPage() {
      const pages = this.pagesByMode[this.activeMode] ?? []
      if (pages.length === 0) return
      const nextIndex = Math.min(pages.length - 1, (this.pageIndexByMode[this.activeMode] ?? 0) + 1)
      this.pageIndexByMode[this.activeMode] = nextIndex
      this.lastAction = `${this.activeMode} page: ${pages[nextIndex]?.label ?? ''}`
      if (this.activeMode === 'BROWSER') {
        this.syncBrowserDisplay()
      }
    },
    prevPage() {
      const pages = this.pagesByMode[this.activeMode] ?? []
      if (pages.length === 0) return
      const nextIndex = Math.max(0, (this.pageIndexByMode[this.activeMode] ?? 0) - 1)
      this.pageIndexByMode[this.activeMode] = nextIndex
      this.lastAction = `${this.activeMode} page: ${pages[nextIndex]?.label ?? ''}`
      if (this.activeMode === 'BROWSER') {
        this.syncBrowserDisplay()
      }
    },
    pressSoftButton(index: number) {
      const btn = this.activeSoftButtons[index]
      if (!btn || btn.enabled === false) return
      const actionId = this.shiftHeld && btn.shiftActionId ? btn.shiftActionId : btn.actionId
      this.applyAction(actionId, btn.label)
    },
    applyAction(actionId: string, label?: string) {
      const browser = useBrowserStore()
      switch (actionId) {
        case 'BROWSER_SEARCH':
          void browser.search()
          this.lastAction = 'Browser search'
          break
        case 'BROWSER_TAG':
        case 'BROWSER_TAG_RECENT':
          if (browser.library.selectedId) {
            browser.openTagDialog(browser.library.selectedId)
            this.lastAction = 'Tag dialog opened'
          }
          break
        case 'BROWSER_PREHEAR':
          void browser.prehearSelected()
          this.lastAction = 'Prehear triggered'
          break
        case 'BROWSER_STOP':
          browser.stopPrehear()
          this.lastAction = 'Prehear stopped'
          break
        case 'BROWSER_LOAD':
        case 'BROWSER_REPLACE':
          void browser.importSelected()
          this.lastAction = 'Import triggered'
          break
        case 'BROWSER_IMPORT_TO_PAD':
          this.lastAction = 'Import to pad triggered'
          break
        case 'BROWSER_FAVORITES':
          if (browser.library.selectedId) {
            void browser.toggleFavorite(browser.library.selectedId)
            this.lastAction = 'Favorite toggled'
          } else {
            browser.setFilter('favorites', !browser.filters.favorites)
            this.lastAction = browser.filters.favorites ? 'Favorites filter on' : 'Favorites filter off'
          }
          break
        case 'BROWSER_CLEAR':
          browser.selectResult(null)
          browser.selectPath(null)
          this.lastAction = 'Browser cleared'
          break
        case 'BROWSER_PLUGIN_MENU':
        case 'PLUGIN_INSTANCE':
        case 'PLUGIN_SWAP':
        case 'CHANNEL_SOUND':
        case 'CHANNEL_GROUP':
        case 'CHANNEL_MASTER':
          this.lastAction = label ? `${label} triggered` : actionId
          break
        case 'FILE_SAVE':
        case 'FILE_SAVE_AS':
          this.lastAction = 'Project saved (demo)'
          break
        case 'SETTINGS_METRO':
          this.statusFlags.metronome = !this.statusFlags.metronome
          this.lastAction = `Metronome ${this.statusFlags.metronome ? 'On' : 'Off'}`
          break
        case 'SETTINGS_COUNTIN':
          this.statusFlags.countIn = !this.statusFlags.countIn
          this.lastAction = `Count-in ${this.statusFlags.countIn ? 'On' : 'Off'}`
          break
        case 'AUTO_ARM':
          this.statusFlags.automationArmed = !this.statusFlags.automationArmed
          this.lastAction = `Automation ${this.statusFlags.automationArmed ? 'Armed' : 'Disarmed'}`
          break
        default:
          this.lastAction = label ? `${label} triggered` : actionId
      }
    },
    tiltEncoder4D(direction: 'left' | 'right' | 'up' | 'down') {
      if (!this.encoder4D) return
      const browser = useBrowserStore()
      if (browser.tagDialogOpen) {
        if (direction === 'right') {
          browser.closeTagDialog()
          this.syncBrowserDisplay()
          return
        }
        if (direction === 'up' || direction === 'down') {
          this.encoder4D.tiltVertical(direction)
          this.syncBrowserDisplay()
        }
        return
      }
      if (direction === 'left' || direction === 'right') {
        this.encoder4D.tiltHorizontal(direction)
        this.syncBrowserDisplay()
        return
      }
      this.encoder4D.tiltVertical(direction)
      this.syncListSelection()
    },
    turnEncoder4D(delta: number) {
      if (!this.encoder4D) return
      const browser = useBrowserStore()
      if (browser.tagDialogOpen) {
        this.encoder4D.setMode('list-navigate')
        this.encoder4D.turn(delta)
        this.syncBrowserDisplay()
        return
      }
      const mode = this.encoder4D.mode.value
      this.encoder4D.turn(delta)
      if (mode === 'value-adjust') {
        this.applyEncoderFieldFilter()
      } else if (mode === 'list-navigate') {
        this.syncListSelection()
      }
    },
    async pressEncoder4D() {
      if (!this.encoder4D) return
      const browser = useBrowserStore()
      if (browser.tagDialogOpen) {
        const index = clamp(this.encoder4D.activeListIndex.value, 0, browser.availableTags.length - 1)
        const tag = browser.availableTags[index]
        if (tag) {
          const selectedId = browser.tagDialogItemId ?? browser.library.selectedId
          const selected = browser.library.results.find((item) => item.id === selectedId)
          const assigned = selected?.tags?.includes(tag) ?? false
          if (!assigned) {
            await browser.addTagToSelected(tag)
          }
          this.syncBrowserDisplay()
        }
        return
      }
      const previousMode = this.encoder4D.mode.value
      if (previousMode === 'value-adjust') {
        this.applyEncoderFieldFilter()
      }
      this.encoder4D.press()
      if (previousMode === 'list-navigate') {
        if (this.activeMode === 'FILE') {
          await browser.importSelected()
        } else {
          this.syncListSelection()
        }
      }
      if (this.encoder4D.mode.value === 'list-navigate') {
        this.syncListSelection()
      } else {
        this.syncBrowserDisplay()
      }
    },
    turnEncoder(index: number, delta: number, options?: { fine?: boolean }) {
      const page = this.activePage
      if (!page) return
      const params = page.params
      const param = params[index]
      if (!param) return
      const step = options?.fine ? param.fineStep ?? Math.max(0.25, param.step / 4) : param.step
      const nextValue = clamp(param.value + delta * step, param.min, param.max)
      param.value = nextValue
      this.lastAction = `${param.name}: ${Math.round(nextValue * 100) / 100}${param.format ? ` ${param.format}` : ''}`
    },
    turnEncoderById(id: string, delta: number, options?: { fine?: boolean }) {
      const params = this.activeParams
      const index = params.findIndex((param) => param.id === id)
      if (index >= 0) {
        this.turnEncoder(index, delta, options)
      }
    }
  }
})
