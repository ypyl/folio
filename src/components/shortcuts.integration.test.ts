import { afterEach, describe, expect, it } from 'vitest'
import { CodeMirrorAdapter } from '../editor/codemirror'
import { SHORTCUT_GROUPS, displayKeys } from './shortcuts'

describe('displayKeys', () => {
  const original = navigator.platform
  afterEach(() => {
    Object.defineProperty(navigator, 'platform', { value: original, configurable: true })
  })

  it('renders Mod as Ctrl on non-mac platforms', () => {
    Object.defineProperty(navigator, 'platform', { value: 'Win32', configurable: true })
    expect(displayKeys('Mod-b')).toBe('Ctrl+B')
    expect(displayKeys('Mod-Alt-1')).toBe('Ctrl+Alt+1')
    expect(displayKeys('Shift-Mod-z')).toBe('Shift+Ctrl+Z')
    expect(displayKeys('Mod-[')).toBe('Ctrl+[')
    expect(displayKeys('Mod-]')).toBe('Ctrl+]')
  })

  it('renders Mod as Cmd on mac platforms', () => {
    Object.defineProperty(navigator, 'platform', { value: 'MacIntel', configurable: true })
    expect(displayKeys('Mod-b')).toBe('Cmd+B')
    expect(displayKeys('Mod-Alt-1')).toBe('Cmd+Alt+1')
  })
})

const sheetItems = SHORTCUT_GROUPS.flatMap((group) => group.items)
const sheetItem = (label: string) => sheetItems.find((item) => item.label === label)

// The sheet lists only what the app binds (keyboard-shortcuts-help, and the
// ADR-0008 supersession that took the formatting chords with the WYSIWYG
// surface). The chords are pinned as data here, so a formatting row reappearing
// fails rather than quietly advertising a chord nothing claims.
describe('sheet vs editor bindings', () => {
  it('lists exactly the chords the app still binds', () => {
    expect(sheetItems.map((item) => [item.label, item.keys.map((key) => key.chord)])).toEqual([
      ['Undo', ['Mod-z']],
      ['Redo', ['Mod-y', 'Shift-Mod-z']],
      ['Open reference', ['Mod-Enter']],
      ['Back / Forward', ['Mod-[', 'Mod-]']],
      ['Search notes', ['Mod-k', 'Mod-p']],
    ])
    // The shared history row pins each chord's own action and gate
    // (add-compact-the-history-shortcut-row).
    expect(sheetItem('Back / Forward')?.keys.map((key) => [key.label, key.surface])).toEqual([
      ['Back', 'back'],
      ['Forward', 'forward'],
    ])
    expect(SHORTCUT_GROUPS.map((group) => group.heading)).toEqual(['Editing', 'App'])
  })

  it('lists no formatting or table chord', () => {
    for (const gone of [
      'Bold',
      'Italic',
      'Inline code',
      'Heading 1',
      'Heading 6',
      'Normal paragraph',
      'Ordered list',
      'Bullet list',
      'Blockquote',
      'Code block',
      'Exit code block',
      'Cancel code block',
      'Format JSON block',
      'Insert table',
      'Add row',
      'Add column',
      'Align column left',
      'Align column right',
      'Delete row',
      'Delete column',
      'Next table cell',
      'Previous table cell',
      'Exit table',
      'Indent list item',
      'Outdent list item',
      'Line break',
      'Paste as plain text',
    ]) {
      expect(sheetItem(gone), `${gone} should no longer be listed`).toBeUndefined()
    }
  })

  it('has no non-clickable row left', () => {
    // The one documented-but-unreplayable row was the paste modifier. Every row
    // that remains is a control, so a click on it applies its chord.
    expect(sheetItems.filter((item) => item.replayable === false)).toEqual([])
  })

  it('the editor claims the history chords the sheet lists', async () => {
    // `applyChord` (ADR-0016) replays the chord at the editor surface, so a
    // sheet row that no keymap resolves would report itself as not applied.
    // History is the one editor row whose chord is context-free, so it is the
    // one that can be checked with no caret in a reference.
    const host = document.createElement('div')
    document.body.append(host)
    const adapter = new CodeMirrorAdapter()
    await adapter.mount(host)
    try {
      await adapter.setContent('first')
      adapter.insertMarkdown(' second')
      expect(adapter.applyChord('Mod-z')).toBe(true)
      expect(adapter.applyChord('Mod-y')).toBe(true)
    } finally {
      await adapter.destroy()
      host.remove()
    }
  })

  it('the Open reference row matches the chord the editor claims in a reference', async () => {
    expect(sheetItem('Open reference')?.keys.map((key) => key.chord)).toEqual(['Mod-Enter'])
    expect(displayKeys('Mod-Enter')).toMatch(/^(Ctrl|Cmd)\+Enter$/)

    const host = document.createElement('div')
    document.body.append(host)
    const adapter = new CodeMirrorAdapter()
    await adapter.mount(host)
    try {
      await adapter.setContent('see #Inbox end\n')
      const opened: string[] = []
      adapter.onReferenceClick((target) => opened.push(target))
      // The seed leaves the caret at the document start, outside the reference.
      // The chord is still claimed, so the editor's own binding for Mod-Enter
      // (inserting a blank line, which the sheet does not document) cannot act.
      expect(adapter.applyChord('Mod-Enter')).toBe(true)
      expect(opened).toEqual([])
      expect(adapter.staticBlocks().length).toBe(1)
    } finally {
      await adapter.destroy()
      host.remove()
    }
  })
})
