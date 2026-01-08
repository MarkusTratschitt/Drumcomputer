/**
 * Global keyboard shortcuts catalog.
 * Defines all command IDs and their default key bindings.
 */

export const SHORTCUT_COMMANDS = {
  // Transport
  TRANSPORT_PLAY: 'Space',
  TRANSPORT_STOP: 'Shift+Space',
  TRANSPORT_RECORD: 'Ctrl+R',
  TRANSPORT_TAP_TEMPO: 'T',
  TRANSPORT_METRONOME: 'M',
  TRANSPORT_COUNT_IN: 'C',
  TRANSPORT_LOOP: 'L',
  TRANSPORT_FOLLOW: 'F',

  // Browser
  BROWSER_OPEN: 'B',
  BROWSER_CLOSE: 'Escape',
  BROWSER_SEARCH_FOCUS: '/',
  BROWSER_PREVIEW_PLAY: 'P',
  BROWSER_PREVIEW_STOP: 'Shift+P',
  BROWSER_LOAD_SELECTED: 'Enter',
  BROWSER_FAVORITE_TOGGLE: 'Shift+F',
  BROWSER_MODE_LIBRARY: 'Shift+L',
  BROWSER_MODE_FILES: 'Shift+B',

  // Pads (grid-style layout: 1-4 / Q-R / A-F / Z-V)
  PAD_SELECT_1: '1',
  PAD_SELECT_2: '2',
  PAD_SELECT_3: '3',
  PAD_SELECT_4: '4',
  PAD_SELECT_5: 'Q',
  PAD_SELECT_6: 'W',
  PAD_SELECT_7: 'E',
  PAD_SELECT_8: 'R',
  PAD_SELECT_9: 'A',
  PAD_SELECT_10: 'S',
  PAD_SELECT_11: 'D',
  PAD_SELECT_12: 'F',
  PAD_SELECT_13: 'Z',
  PAD_SELECT_14: 'X',
  PAD_SELECT_15: 'C',
  PAD_SELECT_16: 'V',

  PAD_MUTE: 'Shift+M',
  PAD_SOLO: 'Shift+S',
  PAD_ERASE: 'Shift+E',
  PAD_DUPLICATE: 'Shift+D',

  // 4D Encoder (fallback, already in component)
  ENCODER_TURN_UP: 'ArrowUp',
  ENCODER_TURN_DOWN: 'ArrowDown',
  ENCODER_TILT_LEFT: 'ArrowLeft',
  ENCODER_TILT_RIGHT: 'ArrowRight',
  ENCODER_PRESS: 'Enter',

  // Modes
  MODE_CHANNEL: 'Ctrl+1',
  MODE_PLUGIN: 'Ctrl+2',
  MODE_ARRANGER: 'Ctrl+3',
  MODE_MIXER: 'Ctrl+4',
  MODE_BROWSER: 'Ctrl+B',
  MODE_SAMPLING: 'Ctrl+5',

  // Pattern/Scene
  PATTERN_NEW: 'Ctrl+N',
  PATTERN_DUPLICATE: 'Ctrl+D',
  PATTERN_CLEAR: 'Ctrl+Delete',
  SCENE_PLAY: 'Ctrl+Space',
  SCENE_STOP: 'Ctrl+Shift+Space',

  // Undo/Redo
  UNDO: 'Ctrl+Z',
  REDO: 'Ctrl+Shift+Z'
} as const

export type ShortcutCommandId = keyof typeof SHORTCUT_COMMANDS
