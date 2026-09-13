// Keyboard-shortcuts data (keyboard-shortcuts-help, move-help-to-right-panel,
// apply-shortcuts-on-click). Pure-data concerns: how a shortcut renders, and
// whether the sheet still matches what the editor actually binds. Since the
// sheet became the dispatch surface for the chords it lists — a click replays
// them — this guard protects behaviour rather than documentation. The list's
// rendering lives in ShortcutsList.test.tsx.

import { afterEach, beforeAll, afterAll, describe, expect, it } from 'vitest'
import { historyKeymap } from '@milkdown/plugin-history'
import {
  blockquoteKeymap,
  bulletListKeymap,
  codeBlockKeymap,
  emphasisKeymap,
  hardbreakKeymap,
  headingKeymap,
  inlineCodeKeymap,
  listItemKeymap,
  orderedListKeymap,
  paragraphKeymap,
  strongKeymap,
} from '@milkdown/preset-commonmark'
import { MilkdownAdapter } from '../editor/milkdown'
import { REFERENCE_OPEN_SHORTCUT } from '../editor/inlineDecorations'
import { tableKeymap } from '@milkdown/preset-gfm'
import { tableChords } from '../editor/tableSetup'
import { SHORTCUT_GROUPS, displayKeys } from './shortcuts'

describe('displayKeys', () => {
  const original = navigator.platform
  afterEach(() => {
    Object.defineProperty(navigator, 'platform', { value: original, configurable: true })
  })

  it('renders Mod as Ctrl on non-mac platforms', () => {
    Object.defineProperty(navigator, 'platform', { value: 'Win32', configurable: true })
    expect(displayKeys('Mod-b')).toBe('Ctrl+B')
    expect(displayKeys('Shift-Mod-z')).toBe('Shift+Ctrl+Z')
    expect(displayKeys('Mod-Alt-1')).toBe('Ctrl+Alt+1')
    expect(displayKeys('Tab')).toBe('Tab')
  })

  it('renders Mod as Cmd on mac platforms', () => {
    Object.defineProperty(navigator, 'platform', { value: 'MacIntel', configurable: true })
    expect(displayKeys('Mod-b')).toBe('Cmd+B')
    expect(displayKeys('Mod-k')).toBe('Cmd+K')
  })
})

const sheetItems = SHORTCUT_GROUPS.flatMap((group) => group.items)
const sheetItem = (label: string) => sheetItems.find((item) => item.label === label)

// Chords the app binds outside ProseMirror's keymaps: the code block's own
// CodeMirror surface owns Mod-Enter and Backspace, the reference badge plugin
// owns its own chord, and the app's search listener owns Mod-k. They are listed
// explicitly rather than omitted, so a chord moved out of a ProseMirror keymap
// fails the union check below instead of silently drifting.
const CHORDS_BOUND_ELSEWHERE = new Set<string>([
  'Mod-Enter',
  'Backspace',
  REFERENCE_OPEN_SHORTCUT,
  'Mod-k',
])

// Drift guard (keyboard-shortcuts-help design; extended by
// move-help-to-right-panel and apply-shortcuts-on-click): every row the sheet
// makes clickable must name a chord the app really binds, or a click would
// dispatch something nothing can claim. The bindings are read from the running
// editor's ctx, so a preset remap fails these tests rather than silently
// leaving the sheet — and the sheet's chords decide what a click runs.
describe('sheet vs editor bindings', () => {
  const el = document.createElement('div')
  const adapter = new MilkdownAdapter()

  const ctxGet = <T>(key: unknown): T =>
    (
      adapter as unknown as {
        editor: { action: (f: (ctx: unknown) => unknown) => unknown }
      }
    ).editor.action((ctx) => (ctx as { get: (k: unknown) => unknown }).get(key)) as T

  /** Every keymap the editor registers, as (ctx key, label) pairs. */
  const keymaps: [unknown, string][] = [
    [strongKeymap.key, 'strong'],
    [emphasisKeymap.key, 'emphasis'],
    [inlineCodeKeymap.key, 'inlineCode'],
    [headingKeymap.key, 'heading'],
    [paragraphKeymap.key, 'paragraph'],
    [bulletListKeymap.key, 'bulletList'],
    [orderedListKeymap.key, 'orderedList'],
    [listItemKeymap.key, 'listItem'],
    [blockquoteKeymap.key, 'blockquote'],
    [codeBlockKeymap.key, 'codeBlock'],
    [hardbreakKeymap.key, 'hardbreak'],
    [historyKeymap.key, 'history'],
    // The table slice's two keymaps (add-table-editing): the preset's own for
    // navigation and the exit, and Folio's for the structural edits.
    [tableKeymap.key, 'table'],
    [tableChords.key, 'tableChords'],
  ]

  beforeAll(async () => {
    document.body.appendChild(el)
    await adapter.mount(el)
  })

  afterAll(async () => {
    await adapter.destroy()
    el.remove()
  })

  it('the sheet Bold shortcut matches the editor binding', () => {
    const binding = ctxGet<{ ToggleBold: { shortcuts: string[] } }>(strongKeymap.key)
    expect(binding.ToggleBold.shortcuts).toContain('Mod-b')
    expect(sheetItem('Bold')?.keys).toContain('Mod-b')
    expect(displayKeys('Mod-b')).toMatch(/^(Ctrl|Cmd)\+B$/)
  })

  it('the sheet Open reference row matches the badge binding', () => {
    // The decoration plugin binds this chord (inlineDecorations); the sheet must list
    // the same one so the reference stays discoverable.
    expect(REFERENCE_OPEN_SHORTCUT).toBe('Mod-Enter')
    expect(sheetItem('Open reference')?.keys).toEqual([REFERENCE_OPEN_SHORTCUT])
    expect(displayKeys(REFERENCE_OPEN_SHORTCUT)).toMatch(/^(Ctrl|Cmd)\+Enter$/)
  })

  it('the sheet lists the code-block exit and convert shortcuts', () => {
    // The code-block component owns these: Mod-Enter runs exitCode, and a
    // Backspace at offset 0 of a one-line block converts it to a paragraph
    // (verified in the running app, not in the ProseMirror keymap ctx).
    expect(sheetItem('Exit code block')?.keys).toEqual(['Mod-Enter'])
    expect(sheetItem('Cancel code block')?.keys).toEqual(['Backspace'])
    expect(displayKeys('Mod-Enter')).toMatch(/^(Ctrl|Cmd)\+Enter$/)
    // Mod-Enter is context-dependent: it is listed under each action it serves.
    expect(sheetItem('Open reference')?.keys).toEqual(['Mod-Enter'])
  })

  it('every heading level row matches the live heading binding', () => {
    const binding = ctxGet<Record<string, { shortcuts: string }>>(headingKeymap.key)

    // One row per level (no range entry): the sheet names each level's own
    // chord, and the editor really binds each of those chords.
    for (let level = 1; level <= 6; level += 1) {
      expect(sheetItem(`Heading ${level}`)?.keys).toEqual([`Mod-Alt-${level}`])
      expect(binding[`TurnIntoH${level}`]?.shortcuts).toBe(`Mod-Alt-${level}`)
    }
    expect(sheetItem('Heading 1-6')).toBeUndefined()
  })

  it('the sheet lists the table rows, and the editor binds each of them', () => {
    // The table rows are controls like any other: every one of their chords is
    // dispatched by a keymap the editor registers (the union check below covers
    // that too; this pins the rows themselves).
    const table = ctxGet<Record<string, { shortcuts: string | string[] }>>(tableKeymap.key)
    const folio = ctxGet<Record<string, { shortcuts: string | string[] }>>(tableChords.key)
    expect([table.NextCell.shortcuts].flat()).toContain('Tab')
    expect([table.PrevCell.shortcuts].flat()).toContain('Shift-Tab')
    expect([table.ExitTable.shortcuts].flat()).toContain('Enter')
    expect(folio.InsertTable.shortcuts).toBe('Mod-Alt-t')
    expect(folio.AddRow.shortcuts).toBe('Mod-Alt-Enter')
    expect(folio.AddCol.shortcuts).toBe('Mod-Alt-Shift-Enter')

    expect(sheetItem('Insert table')?.keys).toEqual(['Mod-Alt-t'])
    expect(sheetItem('Add row')?.keys).toEqual(['Mod-Alt-Enter'])
    expect(sheetItem('Add column')?.keys).toEqual(['Mod-Alt-Shift-Enter'])
    expect(sheetItem('Next table cell')?.keys).toEqual(['Tab'])
    expect(sheetItem('Previous table cell')?.keys).toEqual(['Shift-Tab'])
    expect(sheetItem('Exit table')?.keys).toEqual(['Enter'])

    // Every one is a control, not a documented gesture: a click applies it.
    for (const label of [
      'Insert table',
      'Add row',
      'Add column',
      'Next table cell',
      'Previous table cell',
      'Exit table',
    ]) {
      expect(sheetItem(label)?.replayable).not.toBe(false)
    }

    // Tab, Shift-Tab, and Enter are context-dependent, so they stay listed
    // under their text actions as well.
    expect(sheetItem('Indent list item')?.keys).toContain('Tab')
    expect(sheetItem('Outdent list item')?.keys).toContain('Shift-Tab')
    expect(sheetItem('Exit code block')?.keys).toContain('Mod-Enter')
    expect(displayKeys('Mod-Alt-Shift-Enter')).toMatch(/^(Ctrl|Cmd)\+Alt\+Shift\+Enter$/)
  })

  it('every clickable row names a chord the app actually binds', () => {
    const bound = new Set<string>()
    for (const [key] of keymaps) {
      const entries = ctxGet<Record<string, { shortcuts: string | string[] }>>(key) ?? {}
      for (const entry of Object.values(entries)) {
        for (const chord of [entry.shortcuts].flat()) bound.add(chord)
      }
    }

    const clickable = sheetItems.filter((item) => item.replayable !== false)
    expect(clickable.length).toBeGreaterThan(0)
    for (const item of clickable) {
      for (const chord of item.keys) {
        const known = bound.has(chord) || CHORDS_BOUND_ELSEWHERE.has(chord)
        expect(known, `${item.label} lists ${chord}, which nothing binds`).toBe(true)
      }
    }
  })

  it('the one non-clickable row documents a chord that is not a keydown binding', () => {
    const plain = sheetItems.filter((item) => item.replayable === false)
    expect(plain.map((item) => item.label)).toEqual(['Paste as plain text'])
    // It is a paste modifier, not a keymap entry — which is exactly why a click
    // cannot perform it (design D4).
    expect(plain[0].keys).toEqual(['Shift-Mod-v'])
  })
})
