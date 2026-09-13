// The keyboard-shortcuts reference data (keyboard-shortcuts-help). The sheet
// lists only what the app actually binds — the editor shortcuts come from the
// Milkdown commonmark preset keymaps and plugin-history, and search is the
// app's own Cmd/Ctrl+K. Links and strikethrough have no keymap and are
// deliberately absent. `Mod` is shown as Ctrl on Windows/Linux and Cmd on
// macOS. Lives outside the component so ShortcutsList stays pure-component
// (fast-refresh) and tests can import the data directly.
//
// Since apply-shortcuts-on-click this data is also the dispatch table: every row
// whose chord the app binds on keydown is a control that replays that chord,
// `target` says which surface it acts on, and `replayable: false` marks the one
// row that documents a gesture a click cannot perform. A row's chord is now a
// runtime value, so the drift guard in shortcuts.test.ts protects behaviour
// rather than documentation.

interface ShortcutItem {
  label: string
  keys: string[]
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
      { label: 'Bold', keys: ['Mod-b'] },
      { label: 'Italic', keys: ['Mod-i'] },
      { label: 'Inline code', keys: ['Mod-e'] },
      { label: 'Undo', keys: ['Mod-z'] },
      { label: 'Redo', keys: ['Mod-y', 'Shift-Mod-z'] },
      // One row per level rather than the old `Mod-Alt-1..6` range
      // (apply-shortcuts-on-click, design D3): a range stands for six chords
      // but has no single action to apply. The range only existed because six
      // chips on one row measured 522px; six rows each fit on one line, and
      // each is narrower than the Paste-as-plain-text row the panel already
      // fits.
      { label: 'Heading 1', keys: ['Mod-Alt-1'] },
      { label: 'Heading 2', keys: ['Mod-Alt-2'] },
      { label: 'Heading 3', keys: ['Mod-Alt-3'] },
      { label: 'Heading 4', keys: ['Mod-Alt-4'] },
      { label: 'Heading 5', keys: ['Mod-Alt-5'] },
      { label: 'Heading 6', keys: ['Mod-Alt-6'] },
      { label: 'Normal paragraph', keys: ['Mod-Alt-0'] },
      { label: 'Ordered list', keys: ['Mod-Alt-7'] },
      { label: 'Bullet list', keys: ['Mod-Alt-8'] },
      { label: 'Blockquote', keys: ['Mod-Shift-b'] },
      { label: 'Code block', keys: ['Mod-Alt-c'] },
      { label: 'Exit code block', keys: ['Mod-Enter'] },
      { label: 'Cancel code block', keys: ['Backspace'] },
      // Tables (add-table-editing): a table is the other block with a surface of
      // its own — a way in, a way to extend it, a way to move inside it, a way
      // out. Tab, Shift-Tab, and Enter therefore appear twice: what they do
      // depends on the caret being inside a table, and a chord is listed under
      // each action it serves.
      { label: 'Insert table', keys: ['Mod-Alt-t'] },
      // "Row" and "column" rather than "table row"/"table column": these sit
      // directly under "Insert table", and the panel fits one line per row at
      // its default width — which the longer labels broke against the column
      // chord's four tokens.
      { label: 'Add row', keys: ['Mod-Alt-Enter'] },
      { label: 'Add column', keys: ['Mod-Alt-Shift-Enter'] },
      // The controls that live only on the row and column handles
      // (align-and-delete-table-by-chord): without these the keyboard cannot
      // reach them at all.
      { label: 'Align column left', keys: ['Mod-Alt-l'] },
      { label: 'Align column center', keys: ['Mod-Alt-m'] },
      { label: 'Align column right', keys: ['Mod-Alt-r'] },
      { label: 'Delete row', keys: ['Mod-Alt-d'] },
      { label: 'Delete column', keys: ['Mod-Alt-Shift-d'] },
      { label: 'Next table cell', keys: ['Tab'] },
      { label: 'Previous table cell', keys: ['Shift-Tab'] },
      { label: 'Exit table', keys: ['Enter'] },
      { label: 'Indent list item', keys: ['Tab', 'Mod-]'] },
      { label: 'Outdent list item', keys: ['Shift-Tab', 'Mod-['] },
      { label: 'Line break', keys: ['Shift-Enter'] },
      // Documented but not a control: this modifier is read from the paste
      // event, so no click can perform it (design D4).
      { label: 'Paste as plain text', keys: ['Shift-Mod-v'], replayable: false },
      { label: 'Open reference', keys: ['Mod-Enter'] },
    ],
  },
  {
    heading: 'App',
    target: 'app',
    items: [{ label: 'Search notes', keys: ['Mod-k'] }],
  },
]

const modKey = (): string => (/Mac/i.test(navigator.platform) ? 'Cmd' : 'Ctrl')

/** Render a Milkdown-style shortcut (Mod-b, Mod-Alt-1) for display. */
export function displayKeys(raw: string): string {
  const mod = modKey()
  return raw
    .split('-')
    .map((part) => {
      if (part === 'Mod') return mod
      // Milkdown writes plain keys in lowercase (Mod-b); show them as Ctrl+B.
      if (/^[a-z]$/.test(part)) return part.toUpperCase()
      return part
    })
    .join('+')
}
