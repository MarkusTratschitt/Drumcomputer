/**
 * Global keyboard shortcut registry and dispatcher.
 * Provides command-based shortcuts with tooltip integration.
 */

export interface ShortcutCommand {
  keys: string // e.g., "Ctrl+K", "Shift+Space", "1"
  handler: () => void | Promise<void>
  description: string // human-readable action name
}

interface ParsedKey {
  ctrl: boolean
  shift: boolean
  alt: boolean
  meta: boolean
  key: string
}

const registry = new Map<string, ShortcutCommand>()

/**
 * Parse key combo string into normalized form.
 * @example parseKeyCombo("Ctrl+K") → { ctrl: true, shift: false, alt: false, meta: false, key: "k" }
 */
function parseKeyCombo(combo: string): ParsedKey {
  const parts = combo.split('+').map((s) => s.trim())
  const parsed: ParsedKey = {
    ctrl: false,
    shift: false,
    alt: false,
    meta: false,
    key: ''
  }

  for (const part of parts) {
    const lower = part.toLowerCase()
    if (lower === 'ctrl' || lower === 'control') {
      parsed.ctrl = true
    } else if (lower === 'shift') {
      parsed.shift = true
    } else if (lower === 'alt') {
      parsed.alt = true
    } else if (lower === 'meta' || lower === 'cmd') {
      parsed.meta = true
    } else {
      parsed.key = part.toLowerCase()
    }
  }

  return parsed
}

/**
 * Check if keyboard event matches parsed key combo.
 */
function matchesCombo(event: KeyboardEvent, combo: ParsedKey): boolean {
  const eventKey = event.key.toLowerCase()

  // Normalize Space key
  const normalizedKey = eventKey === ' ' ? 'space' : eventKey

  if (normalizedKey !== combo.key) return false
  if (event.ctrlKey !== combo.ctrl) return false
  if (event.shiftKey !== combo.shift) return false
  if (event.altKey !== combo.alt) return false
  if (event.metaKey !== combo.meta) return false

  return true
}

/**
 * Register a keyboard shortcut command.
 */
export function registerShortcut(commandId: string, command: ShortcutCommand): void {
  registry.set(commandId, command)
}

/**
 * Unregister a keyboard shortcut command.
 */
export function unregisterShortcut(commandId: string): void {
  registry.delete(commandId)
}

/**
 * Dispatch keyboard event to registered shortcuts.
 * Returns true if a command was executed.
 */
export function dispatchShortcut(event: KeyboardEvent): boolean {
  // Sort by key length descending (longest match wins)
  const commands = Array.from(registry.entries()).sort((a, b) => b[1].keys.length - a[1].keys.length)

  for (const [_id, command] of commands) {
    const parsed = parseKeyCombo(command.keys)
    if (matchesCombo(event, parsed)) {
      event.preventDefault()
      void command.handler()
      return true
    }
  }

  return false
}

/**
 * Get shortcut keys for a command ID.
 */
export function getShortcutKeys(commandId: string): string | null {
  return registry.get(commandId)?.keys ?? null
}

/**
 * Generate tooltip with shortcut hint.
 * @example shortcutTitle("TRANSPORT_PLAY", "Play") → "Play (Space)"
 */
export function shortcutTitle(commandId: string, label: string): string {
  const keys = getShortcutKeys(commandId)
  return keys ? `${label} (${keys})` : label
}

/**
 * Get all registered commands (for debugging/settings UI).
 */
export function getAllCommands(): Array<{ id: string; command: ShortcutCommand }> {
  return Array.from(registry.entries()).map(([id, command]) => ({ id, command }))
}

/**
 * Clear all registered shortcuts (for testing).
 */
export function clearShortcuts(): void {
  registry.clear()
}

/**
 * Composable hook for shortcut management in components.
 */
export function useShortcuts() {
  return {
    register: registerShortcut,
    unregister: unregisterShortcut,
    dispatch: dispatchShortcut,
    getKeys: getShortcutKeys,
    title: shortcutTitle,
    getAll: getAllCommands,
    clear: clearShortcuts
  }
}
