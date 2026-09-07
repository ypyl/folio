import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { strongKeymap } from '@milkdown/preset-commonmark'
import { MilkdownAdapter } from '../editor/milkdown'
import { ShortcutsDialog } from './ShortcutsDialog'
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

describe('ShortcutsDialog', () => {
  it('is exposed as a dialog and lists the shortcuts with their keys', () => {
    render(<ShortcutsDialog onClose={() => {}} />)
    const dialog = screen.getByRole('dialog', { name: 'Keyboard shortcuts' })
    expect(within(dialog).getByText('Bold')).toBeTruthy()
    expect(within(dialog).getByText(displayKeys('Mod-b'))).toBeTruthy()
    expect(within(dialog).getByText('Search notes')).toBeTruthy()
    expect(within(dialog).getByText(displayKeys('Mod-k'))).toBeTruthy()
  })

  it('lists only real shortcuts — links and strikethrough have no keymap', () => {
    render(<ShortcutsDialog onClose={() => {}} />)
    expect(screen.queryByText('Link')).toBeNull()
    expect(screen.queryByText('Strikethrough')).toBeNull()
  })

  it('moves focus into the dialog on open', () => {
    render(<ShortcutsDialog onClose={() => {}} />)
    expect(document.activeElement).toBe(screen.getByRole('dialog'))
  })

  it('closes on Escape', () => {
    const onClose = vi.fn()
    render(<ShortcutsDialog onClose={onClose} />)
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes via the close control', () => {
    const onClose = vi.fn()
    render(<ShortcutsDialog onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Close keyboard shortcuts' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('returns focus to the opener when it closes', () => {
    const { rerender, getByRole } = render(
      <button type="button" id="opener">
        Open
      </button>,
    )
    const opener = getByRole('button', { name: 'Open' })
    opener.focus()
    rerender(
      <>
        <button type="button" id="opener">
          Open
        </button>
        <ShortcutsDialog onClose={() => {}} />
      </>,
    )
    // Opening moved focus into the dialog…
    expect(document.activeElement).toBe(screen.getByRole('dialog'))
    // …and closing hands it back to the opener.
    rerender(
      <button type="button" id="opener">
        Open
      </button>,
    )
    expect(document.activeElement).toBe(opener)
  })
})

// Drift pin (keyboard-shortcuts-help design): the sheet's Bold row must match
// what the editor actually binds. The preset's binding is read from the
// running editor's ctx, so a preset remap of Mod-b fails this test.
describe('sheet vs editor bindings', () => {
  it('the sheet Bold shortcut matches the editor binding', async () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    const adapter = new MilkdownAdapter()
    await adapter.mount(el)
    const binding = (
      adapter as unknown as {
        editor: { action: (f: (ctx: unknown) => unknown) => unknown }
      }
    ).editor.action((ctx) => {
      const access = ctx as { get: (k: unknown) => unknown }
      return access.get(strongKeymap.key)
    }) as { ToggleBold: { shortcuts: string[] } }
    expect(binding.ToggleBold.shortcuts).toContain('Mod-b')
    const sheetBold = SHORTCUT_GROUPS.flatMap((g) => g.items).find((i) => i.label === 'Bold')
    expect(sheetBold?.keys).toContain('Mod-b')
    expect(displayKeys('Mod-b')).toMatch(/^(Ctrl|Cmd)\+B$/)
    await adapter.destroy()
    el.remove()
  })
})