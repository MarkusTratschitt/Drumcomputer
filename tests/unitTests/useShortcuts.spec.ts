import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  registerShortcut,
  unregisterShortcut,
  dispatchShortcut,
  getShortcutKeys,
  shortcutTitle,
  clearShortcuts,
  useShortcuts
} from '@/composables/useShortcuts'

describe('useShortcuts', () => {
  beforeEach(() => {
    clearShortcuts()
  })

  it('registers and retrieves shortcut keys', () => {
    registerShortcut('TEST_CMD', {
      keys: 'Ctrl+K',
      handler: () => { },
      description: 'Test command'
    })

    expect(getShortcutKeys('TEST_CMD')).toBe('Ctrl+K')
  })

  it('dispatches shortcut on matching key combo', () => {
    const handler = vi.fn()
    registerShortcut('TEST_CMD', {
      keys: 'Ctrl+K',
      handler,
      description: 'Test'
    })

    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true
    })

    const result = dispatchShortcut(event)

    expect(result).toBe(true)
    expect(handler).toHaveBeenCalledOnce()
  })

  it('does not dispatch on non-matching key combo', () => {
    const handler = vi.fn()
    registerShortcut('TEST_CMD', {
      keys: 'Ctrl+K',
      handler,
      description: 'Test'
    })

    const event = new KeyboardEvent('keydown', {
      key: 'j',
      ctrlKey: true
    })

    const result = dispatchShortcut(event)

    expect(result).toBe(false)
    expect(handler).not.toHaveBeenCalled()
  })

  it('handles Space key normalization', () => {
    const handler = vi.fn()
    registerShortcut('TEST_SPACE', {
      keys: 'Space',
      handler,
      description: 'Space test'
    })

    const event = new KeyboardEvent('keydown', {
      key: ' '
    })

    const result = dispatchShortcut(event)

    expect(result).toBe(true)
    expect(handler).toHaveBeenCalled()
  })

  it('prefers longest matching combo', () => {
    const shortHandler = vi.fn()
    const longHandler = vi.fn()

    registerShortcut('SHORT', {
      keys: 'K',
      handler: shortHandler,
      description: 'Short'
    })

    registerShortcut('LONG', {
      keys: 'Shift+K',
      handler: longHandler,
      description: 'Long'
    })

    const event = new KeyboardEvent('keydown', {
      key: 'k',
      shiftKey: true
    })

    dispatchShortcut(event)

    expect(longHandler).toHaveBeenCalled()
    expect(shortHandler).not.toHaveBeenCalled()
  })

  it('dispatches Shift+ArrowUp combos for fine controls', () => {
    const handler = vi.fn()
    registerShortcut('KNOB_INC_FINE', {
      keys: 'Shift+ArrowUp',
      handler,
      description: 'Fine increment'
    })

    const event = new KeyboardEvent('keydown', {
      key: 'ArrowUp',
      shiftKey: true
    })

    const result = dispatchShortcut(event)

    expect(result).toBe(true)
    expect(handler).toHaveBeenCalled()
  })

  it('unregisters shortcuts', () => {
    const handler = vi.fn()
    registerShortcut('TEST_CMD', {
      keys: 'Ctrl+K',
      handler,
      description: 'Test'
    })

    unregisterShortcut('TEST_CMD')

    expect(getShortcutKeys('TEST_CMD')).toBeNull()

    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true
    })

    const result = dispatchShortcut(event)

    expect(result).toBe(false)
    expect(handler).not.toHaveBeenCalled()
  })

  it('generates tooltip with shortcut hint', () => {
    registerShortcut('TEST_CMD', {
      keys: 'Ctrl+K',
      handler: () => { },
      description: 'Test'
    })

    const tooltip = shortcutTitle('TEST_CMD', 'Quick Search')

    expect(tooltip).toBe('Quick Search (Ctrl+K)')
  })

  it('generates tooltip without shortcut if command not registered', () => {
    const tooltip = shortcutTitle('UNKNOWN_CMD', 'Some Action')

    expect(tooltip).toBe('Some Action')
  })

  it('matches case-insensitive keys', () => {
    const handler = vi.fn()
    registerShortcut('TEST_CMD', {
      keys: 'Ctrl+K',
      handler,
      description: 'Test'
    })

    const event = new KeyboardEvent('keydown', {
      key: 'K',
      ctrlKey: true
    })

    const result = dispatchShortcut(event)

    expect(result).toBe(true)
    expect(handler).toHaveBeenCalled()
  })

  it('composable returns all API methods', () => {
    const shortcuts = useShortcuts()

    expect(shortcuts.register).toBe(registerShortcut)
    expect(shortcuts.unregister).toBe(unregisterShortcut)
    expect(shortcuts.dispatch).toBe(dispatchShortcut)
    expect(shortcuts.getKeys).toBe(getShortcutKeys)
    expect(shortcuts.title).toBe(shortcutTitle)
    expect(shortcuts.clear).toBe(clearShortcuts)
  })

  describe('Pattern and Scene Commands', () => {
    it('can register and dispatch PATTERN_NEW command', () => {
      const handler = vi.fn()
      registerShortcut('PATTERN_NEW', {
        keys: 'Ctrl+N',
        handler,
        description: 'New Pattern'
      })

      const event = new KeyboardEvent('keydown', {
        key: 'n',
        ctrlKey: true
      })

      const result = dispatchShortcut(event)

      expect(result).toBe(true)
      expect(handler).toHaveBeenCalled()
    })

    it('can register and dispatch PATTERN_DUPLICATE command', () => {
      const handler = vi.fn()
      registerShortcut('PATTERN_DUPLICATE', {
        keys: 'Ctrl+D',
        handler,
        description: 'Duplicate Pattern'
      })

      const event = new KeyboardEvent('keydown', {
        key: 'd',
        ctrlKey: true
      })

      const result = dispatchShortcut(event)

      expect(result).toBe(true)
      expect(handler).toHaveBeenCalled()
    })

    it('can register and dispatch SCENE_PLAY command', () => {
      const handler = vi.fn()
      registerShortcut('SCENE_PLAY', {
        keys: 'Ctrl+Space',
        handler,
        description: 'Play Scene'
      })

      const event = new KeyboardEvent('keydown', {
        key: ' ',
        ctrlKey: true
      })

      const result = dispatchShortcut(event)

      expect(result).toBe(true)
      expect(handler).toHaveBeenCalled()
    })

    it('generates tooltip for UNDO with shortcut', () => {
      registerShortcut('UNDO', {
        keys: 'Ctrl+Z',
        handler: () => { },
        description: 'Undo'
      })

      const tooltip = shortcutTitle('UNDO', 'Undo')

      expect(tooltip).toBe('Undo (Ctrl+Z)')
    })

    it('generates tooltip for REDO with shortcut', () => {
      registerShortcut('REDO', {
        keys: 'Ctrl+Shift+Z',
        handler: () => { },
        description: 'Redo'
      })

      const tooltip = shortcutTitle('REDO', 'Redo')

      expect(tooltip).toBe('Redo (Ctrl+Shift+Z)')
    })
  })
})
