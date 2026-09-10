// The keyboard-shortcuts reference data (keyboard-shortcuts-help). The sheet
// lists only what the app actually binds — the editor shortcuts come from the
// Milkdown commonmark preset keymaps and plugin-history, and search is the
// app's own Cmd/Ctrl+K. Links and strikethrough have no keymap and are
// deliberately absent. `Mod` is shown as Ctrl on Windows/Linux and Cmd on
// macOS. Lives outside the component so ShortcutsList stays pure-component
// (fast-refresh) and tests can import the data directly.

interface ShortcutItem {
  label: string
  keys: string[]
}

export const SHORTCUT_GROUPS: { heading: string; items: ShortcutItem[] }[] = [
  {
    heading: 'Editing',
    items: [
      { label: 'Bold', keys: ['Mod-b'] },
      { label: 'Italic', keys: ['Mod-i'] },
      { label: 'Inline code', keys: ['Mod-e'] },
      { label: 'Undo', keys: ['Mod-z'] },
      { label: 'Redo', keys: ['Mod-y', 'Shift-Mod-z'] },
      {
        label: 'Heading 1-6',
        // One range chord, not six literal entries: displayKeys splits on "-",
        // so this renders as "Ctrl+Alt+1..6". The range is checked against the
        // live keymap in shortcuts.test.ts (drift guard), which is what keeps a
        // range honest where six literal chords could not fit the panel column.
        keys: ['Mod-Alt-1..6'],
      },
      { label: 'Normal paragraph', keys: ['Mod-Alt-0'] },
      { label: 'Ordered list', keys: ['Mod-Alt-7'] },
      { label: 'Bullet list', keys: ['Mod-Alt-8'] },
      { label: 'Blockquote', keys: ['Mod-Shift-b'] },
      { label: 'Code block', keys: ['Mod-Alt-c'] },
      { label: 'Exit code block', keys: ['Mod-Enter'] },
      { label: 'Cancel code block', keys: ['Backspace'] },
      { label: 'Indent list item', keys: ['Tab', 'Mod-]'] },
      { label: 'Outdent list item', keys: ['Shift-Tab', 'Mod-['] },
      { label: 'Line break', keys: ['Shift-Enter'] },
      { label: 'Paste as plain text', keys: ['Shift-Mod-v'] },
      { label: 'Open reference', keys: ['Mod-Enter'] },
    ],
  },
  {
    heading: 'App',
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
