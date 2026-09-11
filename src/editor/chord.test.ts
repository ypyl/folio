// The chord parser (apply-shortcuts-on-click, design D8). Pure data mapping:
// a Milkdown-style chord in, the KeyboardEvent init that replays it out. The
// platform branch is covered for both platforms because `Mod` must resolve to
// the same modifier a real keypress would produce.

import { afterEach, describe, expect, it } from 'vitest'
import { chordToKeyEventInit } from './chord'

describe('chordToKeyEventInit', () => {
  const original = navigator.platform
  afterEach(() => {
    Object.defineProperty(navigator, 'platform', { value: original, configurable: true })
  })

  const setPlatform = (value: string) =>
    Object.defineProperty(navigator, 'platform', { value, configurable: true })

  it('maps Mod to Ctrl on non-mac platforms', () => {
    setPlatform('Win32')
    expect(chordToKeyEventInit('Mod-b')).toMatchObject({ key: 'b', ctrlKey: true })
    expect(chordToKeyEventInit('Shift-Mod-z')).toMatchObject({
      key: 'z',
      ctrlKey: true,
      shiftKey: true,
    })
    expect(chordToKeyEventInit('Mod-Alt-3')).toMatchObject({
      key: '3',
      ctrlKey: true,
      altKey: true,
    })
  })

  it('maps Mod to Meta on mac platforms', () => {
    setPlatform('MacIntel')
    expect(chordToKeyEventInit('Mod-k')).toMatchObject({ key: 'k', metaKey: true })
    expect(chordToKeyEventInit('Mod-k').ctrlKey).toBeUndefined()
  })

  it('keeps a bracketed key intact rather than splitting it', () => {
    setPlatform('Win32')
    expect(chordToKeyEventInit('Mod-]')).toMatchObject({ key: ']', ctrlKey: true })
    expect(chordToKeyEventInit('Mod-[')).toMatchObject({ key: '[', ctrlKey: true })
  })

  it('parses a bare key and a modified non-character key', () => {
    expect(chordToKeyEventInit('Enter')).toMatchObject({ key: 'Enter' })
    expect(chordToKeyEventInit('Backspace')).toMatchObject({ key: 'Backspace' })
    expect(chordToKeyEventInit('Shift-Tab')).toMatchObject({ key: 'Tab', shiftKey: true })
    expect(chordToKeyEventInit('Shift-Tab').ctrlKey).toBeUndefined()
  })

  // The outcome of a replay is `defaultPrevented`, which only becomes true if
  // the event is cancelable; without this flag every chord would report that
  // nothing claimed it.
  it('produces a cancelable, bubbling event', () => {
    const init = chordToKeyEventInit('Mod-b')
    expect(init.cancelable).toBe(true)
    expect(init.bubbles).toBe(true)
  })

  it('produces an event the editor can actually resolve', () => {
    setPlatform('Win32')
    const target = document.createElement('div')
    const seen: KeyboardEvent[] = []
    target.addEventListener('keydown', (event) => {
      seen.push(event)
      event.preventDefault()
    })
    target.dispatchEvent(new KeyboardEvent('keydown', chordToKeyEventInit('Mod-b')))
    expect(seen[0].key).toBe('b')
    expect(seen[0].ctrlKey).toBe(true)
    expect(seen[0].defaultPrevented).toBe(true)
  })
})
