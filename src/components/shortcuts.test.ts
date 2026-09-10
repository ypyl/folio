// Keyboard-shortcuts data (keyboard-shortcuts-help, move-help-to-right-panel).
// Pure-data concerns: how a shortcut renders, and whether the sheet still
// matches what the editor actually binds. The list's rendering lives in
// ShortcutsList.test.tsx.

import { afterEach, beforeAll, afterAll, describe, expect, it } from 'vitest'
import { headingKeymap, strongKeymap } from '@milkdown/preset-commonmark'
import { MilkdownAdapter } from '../editor/milkdown'
import { REFERENCE_OPEN_SHORTCUT } from '../editor/referenceBadges'
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

  // The heading row is one range chord rather than six entries, so the range
  // has to survive the same Mod-to-platform mapping as any other chord.
  it('renders a range chord without mangling the range', () => {
    Object.defineProperty(navigator, 'platform', { value: 'Win32', configurable: true })
    expect(displayKeys('Mod-Alt-1..6')).toBe('Ctrl+Alt+1..6')
    Object.defineProperty(navigator, 'platform', { value: 'MacIntel', configurable: true })
    expect(displayKeys('Mod-Alt-1..6')).toBe('Cmd+Alt+1..6')
  })
})

const sheetItems = SHORTCUT_GROUPS.flatMap((group) => group.items)
const sheetItem = (label: string) => sheetItems.find((item) => item.label === label)

/** Expand a range chord ("Mod-Alt-1..6") into the chords it stands for. */
function expandRange(chord: string): string[] {
  const match = /^(.*?)(\d+)\.\.(\d+)$/.exec(chord)
  if (!match) return [chord]
  const [, prefix, from, to] = match
  const chords: string[] = []
  for (let n = Number(from); n <= Number(to); n += 1) chords.push(`${prefix}${n}`)
  return chords
}

// Drift guard (keyboard-shortcuts-help design; extended by
// move-help-to-right-panel): a sheet row must match what the editor actually
// binds. The bindings are read from the running editor's ctx, so a preset
// remap fails these tests rather than silently leaving the sheet lying. That
// guard is what lets the heading row be a range instead of six literal chords.
describe('sheet vs editor bindings', () => {
  const el = document.createElement('div')
  const adapter = new MilkdownAdapter()

  const ctxGet = <T>(key: unknown): T =>
    (
      adapter as unknown as {
        editor: { action: (f: (ctx: unknown) => unknown) => unknown }
      }
    ).editor.action((ctx) => (ctx as { get: (k: unknown) => unknown }).get(key)) as T

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
    // The badge plugin binds this chord (referenceBadges); the sheet must list
    // the same one so the reference stays discoverable.
    expect(REFERENCE_OPEN_SHORTCUT).toBe('Mod-Enter')
    expect(sheetItem('Open reference')?.keys).toEqual([REFERENCE_OPEN_SHORTCUT])
    expect(displayKeys(REFERENCE_OPEN_SHORTCUT)).toMatch(/^(Ctrl|Cmd)\+Enter$/)
  })

  it('the sheet heading range matches every live heading binding', () => {
    const binding = ctxGet<Record<string, { shortcuts: string }>>(headingKeymap.key)

    // The range stands for exactly levels one through six — no more, no less.
    expect(expandRange(sheetItem('Heading 1-6')?.keys[0] ?? '')).toEqual([
      'Mod-Alt-1',
      'Mod-Alt-2',
      'Mod-Alt-3',
      'Mod-Alt-4',
      'Mod-Alt-5',
      'Mod-Alt-6',
    ])

    // …and the editor really binds each of those levels to its own chord.
    for (let level = 1; level <= 6; level += 1) {
      expect(binding[`TurnIntoH${level}`]?.shortcuts).toBe(`Mod-Alt-${level}`)
    }
  })
})
