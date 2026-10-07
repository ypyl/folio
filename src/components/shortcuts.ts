// The keyboard-shortcuts reference data (keyboard-shortcuts-help). The sheet
// lists only what the app actually binds: history and the reference chord in the
// editor, and the app's own Cmd/Ctrl+K and Cmd/Ctrl+P for search. The formatting
// chords (bold, italic, inline code, headings, lists, blockquote, the code
// block's own chords, and the table chords) went with the WYSIWYG surface
// (ADR-0008 supersession): the Markdown source is visible and typed, so there is
// nothing for a chord to toggle, and a sheet that still listed them would
// advertise chords nothing claims. `Mod` is shown as Ctrl on Windows/Linux and
// Cmd on macOS. Lives outside the component so ShortcutsList stays pure-component
// (fast-refresh) and tests can import the data directly.
//
// Since apply-shortcuts-on-click this data is also the dispatch table: every row
// whose chord the app binds on keydown is a control that replays that chord,
// `target` says which surface it acts on, and `replayable: false` marks the one
// row that documents a gesture a click cannot perform. A row's chord is now a
// runtime value, so the drift guard in shortcuts.test.ts protects behaviour
// rather than documentation.

import { isMac } from '../editor/chord'

/** Which surface's availability gates a control. `back` and `forward` are the
 *  history trail's per-direction gates (add-history-keyboard-shortcuts), so one
 *  history chord can disable while the other stays live. A key without its own
 *  `surface` uses its group's `target`. */
export type ShortcutSurface = 'editor' | 'app' | 'back' | 'forward'

/** One key combination of a row. A shared row (Back / Forward) carries two
 *  actions (add-compact-the-history-shortcut-row), so a key may name its own
 *  action and gate on its own surface; both fall back to the row's. */
export interface ShortcutKey {
  chord: string
  /** The action this key performs, when it differs from the row's label. */
  label?: string
  /** The availability gate for this key, when it differs from the row's group
   *  target. */
  surface?: ShortcutSurface
}

interface ShortcutItem {
  label: string
  keys: ShortcutKey[]
  /** False when the row's key combination is not bound on keydown, so
   *  activating it cannot apply it: the paste shortcut's shift modifier is read
   *  from the paste gesture. Defaults to true. */
  replayable?: boolean
}

export const SHORTCUT_GROUPS: {
  heading: string
  /** Which surface the group's chords act on: the editor's own key surface, or
   *  the document, where the app's key listeners live. */
  target: 'editor' | 'app'
  items: ShortcutItem[]
}[] = [
  {
    heading: 'Editing',
    target: 'editor',
    items: [
      { label: 'Undo', keys: [{ chord: 'Mod-z' }] },
      { label: 'Redo', keys: [{ chord: 'Mod-y' }, { chord: 'Shift-Mod-z' }] },
      // Mod-Enter is context-dependent (it also served leaving a code block);
      // the reference chord is the one meaning left.
      { label: 'Open reference', keys: [{ chord: 'Mod-Enter' }] },
    ],
  },
  {
    heading: 'App',
    target: 'app',
    // replace-header-with-spotlight: the spotlight opens on either chord, so
    // both are listed and each is its own control. The history chords are
    // Logseq's (add-history-keyboard-shortcuts) and share one row
    // (add-compact-the-history-shortcut-row): Back and Forward in the
    // direction-pair's order, each naming its own action and gating on its own
    // direction of the trail.
    items: [
      {
        label: 'Back / Forward',
        keys: [
          { chord: 'Mod-[', label: 'Back', surface: 'back' },
          { chord: 'Mod-]', label: 'Forward', surface: 'forward' },
        ],
      },
      { label: 'Search notes', keys: [{ chord: 'Mod-k' }, { chord: 'Mod-p' }] },
    ],
  },
]

/** Render a chord (Mod-b, Mod-Alt-1) for display. */
export function displayKeys(raw: string): string {
  const mod = isMac() ? 'Cmd' : 'Ctrl'
  return raw
    .split('-')
    .map((part) => {
      if (part === 'Mod') return mod
      // A chord writes plain keys in lowercase (Mod-b); show them as Ctrl+B.
      if (/^[a-z]$/.test(part)) return part.toUpperCase()
      return part
    })
    .join('+')
}
