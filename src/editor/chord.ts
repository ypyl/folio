// The chord parser: the inverse of displayKeys (src/components/shortcuts.ts).
// Turns a Milkdown-style chord ("Mod-b", "Shift-Mod-z", "Mod-]", "Shift-Tab")
// into the KeyboardEvent init that replays it. It lives in the editor layer
// because the adapter is its primary consumer and App already imports editor
// modules; displayKeys stays with the display data it renders.

/** The platform check shared with the shortcuts reference: Mod is Cmd on macOS,
 *  Ctrl elsewhere. */
export const isMac = (): boolean => /Mac/i.test(navigator.platform)

/**
 * The KeyboardEvent init that reproduces `chord`. Breadth of the modifiers is
 * deliberate: `Mod` maps to the platform's primary modifier, so the replayed
 * event resolves through the same keymap entry a real keypress would.
 *
 * Two flags are load-bearing:
 * - `cancelable` — claiming a chord is reported by `preventDefault()`, so an
 *   event that cannot be cancelled could never report that it was applied.
 * - `bubbles` — an editor chord dispatched at the caret's surface also reaches
 *   the app's own listeners on `document`.
 *
 * The event carries an explicit `key` and no `keyCode`, so a replayed chord is
 * layout-independent: it resolves on any keyboard layout, where a real
 * keypress on a non-Latin layout relies on ProseMirror's keyCode fallback.
 */
export function chordToKeyEventInit(chord: string): KeyboardEventInit {
  const parts = chord.split('-')
  const key = parts.pop() ?? ''
  const init: KeyboardEventInit = { key, bubbles: true, cancelable: true }
  const mac = isMac()
  for (const part of parts) {
    if (part === 'Mod') {
      if (mac) init.metaKey = true
      else init.ctrlKey = true
    } else if (part === 'Shift') init.shiftKey = true
    else if (part === 'Alt') init.altKey = true
    else if (part === 'Ctrl') init.ctrlKey = true
    else if (part === 'Meta') init.metaKey = true
  }
  return init
}
