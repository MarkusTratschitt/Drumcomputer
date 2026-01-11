import { describe, it, expect } from 'vitest'
import { useShortcuts } from '../../composables/useShortcuts'
import { SHORTCUT_COMMANDS } from '../../composables/shortcutCommands'

describe('PAD_SELECT shortcuts dispatch', () => {
  it('dispatches PAD_SELECT_n commands with correct keys', () => {
    const shortcuts = useShortcuts()
    shortcuts.clear()

    // Register pad shortcuts as done in DrumMachine.mounted()
    const padMap: Record<string, string> = {
      '1': 'pad1', '2': 'pad2', '3': 'pad3', '4': 'pad4',
      'q': 'pad5', 'w': 'pad6', 'e': 'pad7', 'r': 'pad8',
      'a': 'pad9', 's': 'pad10', 'd': 'pad11', 'f': 'pad12',
      'z': 'pad13', 'x': 'pad14', 'c': 'pad15', 'v': 'pad16'
    }

    Object.entries(padMap).forEach(([_key, _padId], index) => {
      shortcuts.register(`PAD_SELECT_${index + 1}`, {
        keys: SHORTCUT_COMMANDS[`PAD_SELECT_${index + 1}` as keyof typeof SHORTCUT_COMMANDS],
        handler: () => {
          // Handler would normally call handlePad(padId)
        },
        description: `Select Pad ${index + 1}`
      })
    })

    const allCommands = shortcuts.getAll()
    expect(allCommands.filter((c) => c.id.startsWith('PAD_SELECT_'))).toHaveLength(16)

    const pad1Keys = shortcuts.getKeys('PAD_SELECT_1')
    expect(pad1Keys).toBe('1')

    const pad5Keys = shortcuts.getKeys('PAD_SELECT_5')
    expect(pad5Keys).toBe('Q')

    const pad13Keys = shortcuts.getKeys('PAD_SELECT_13')
    expect(pad13Keys).toBe('Z')
  })

  it('generates correct tooltips for pad shortcuts', () => {
    const shortcuts = useShortcuts()
    shortcuts.clear()

    shortcuts.register('PAD_SELECT_1', {
      keys: '1',
      handler: () => { },
      description: 'Select Pad 1'
    })

    const title = shortcuts.title('PAD_SELECT_1', 'Pad 1')
    expect(title).toBe('Pad 1 (1)')
  })
})
