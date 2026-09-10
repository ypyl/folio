import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { ShortcutsList } from './ShortcutsList'
import { SHORTCUT_GROUPS, displayKeys } from './shortcuts'

// Rendering contract for the reference body (move-help-to-right-panel): it is
// content, not a surface. The dialog chrome it used to carry is gone, so the
// tests that matter are the inventory, the group labels, and the absence of
// any dialog/heading semantics.

const items = SHORTCUT_GROUPS.flatMap((group) => group.items)

describe('ShortcutsList', () => {
  it('renders both group labels', () => {
    render(<ShortcutsList />)
    for (const group of SHORTCUT_GROUPS) {
      expect(screen.getByText(group.heading)).toBeTruthy()
    }
  })

  it('renders every entry with its key tokens', () => {
    const { container } = render(<ShortcutsList />)
    for (const item of items) {
      expect(screen.getByText(item.label)).toBeTruthy()
    }
    // One chip per listed key, and the tokens render through displayKeys.
    const chips = container.querySelectorAll('kbd')
    expect(chips).toHaveLength(items.reduce((count, item) => count + item.keys.length, 0))
    expect(container.textContent).toContain(displayKeys('Mod-b'))
    expect(container.textContent).toContain(displayKeys('Mod-k'))
  })

  it('covers the heading levels as a single range entry', () => {
    render(<ShortcutsList />)
    const row = screen.getByText('Heading 1-6').closest('li')
    expect(row).not.toBeNull()
    expect(row?.querySelectorAll('kbd')).toHaveLength(1)
    expect(within(row as HTMLElement).getByText(displayKeys('Mod-Alt-1..6'))).toBeTruthy()
  })

  it('lists only real shortcuts — links and strikethrough have no keymap', () => {
    render(<ShortcutsList />)
    expect(screen.queryByText('Link')).toBeNull()
    expect(screen.queryByText('Strikethrough')).toBeNull()
  })

  it('is not exposed as a dialog', () => {
    render(<ShortcutsList />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('uses no headings — the chrome has none and the summary is not one', () => {
    render(<ShortcutsList />)
    expect(screen.queryByRole('heading')).toBeNull()
  })

  it('labels each group section for assistive technology', () => {
    const { container } = render(<ShortcutsList />)
    const sections = container.querySelectorAll('section')
    expect(sections).toHaveLength(SHORTCUT_GROUPS.length)
    for (const section of sections) {
      const labelId = section.getAttribute('aria-labelledby')
      expect(labelId).toBeTruthy()
      expect(document.getElementById(labelId as string)?.textContent).toBeTruthy()
    }
  })
})
