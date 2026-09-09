// The keyboard-shortcuts reference data (keyboard-shortcuts-help). The sheet
// lists only what the app actually binds — the editor shortcuts come from the
// Milkdown commonmark preset keymaps and plugin-history, and search is the
// app's own Cmd/Ctrl+K. Links and strikethrough have no keymap and are
// deliberately absent. `Mod` is shown as Ctrl on Windows/Linux and Cmd on
// macOS. Lives outside the component so the dialog file stays pure-component
// (fast-refresh) and tests can import the data directly.

export const SHORTCUTS_DIALOG_ID = 'folio-shortcuts-dialog'

export interface ShortcutItem {
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
        keys: ['Mod-Alt-1', 'Mod-Alt-2', 'Mod-Alt-3', 'Mod-Alt-4', 'Mod-Alt-5', 'Mod-Alt-6'],
      },
      { label: 'Normal paragraph', keys: ['Mod-Alt-0'] },
      { label: 'Ordered list', keys: ['Mod-Alt-7'] },
      { label: 'Bullet list', keys: ['Mod-Alt-8'] },
      { label: 'Blockquote', keys: ['Mod-Shift-b'] },
      { label: 'Code block', keys: ['Mod-Alt-c'] },
      { label: 'Indent list item', keys: ['Tab', 'Mod-]'] },
      { label: 'Outdent list item', keys: ['Shift-Tab', 'Mod-['] },
      { label: 'Line break', keys: ['Shift-Enter'] },
      { label: 'Paste as plain text', keys: ['Shift-Mod-v'] },
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
