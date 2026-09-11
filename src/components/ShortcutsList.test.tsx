import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { ShortcutsList } from './ShortcutsList'
import styles from './ShortcutsList.module.css'
import { SHORTCUT_GROUPS, displayKeys } from './shortcuts'

// Rendering contract for the reference body (move-help-to-right-panel), extended
// by apply-shortcuts-on-click: every row the app binds a chord for is a control
// that applies it, a row that documents a paste modifier is a plain label, and a
// row whose surface is unavailable renders disabled. The dialog chrome the list
// once carried is gone, so the tests still cover the inventory, the group
// labels, and the absence of any dialog/heading semantics.

const items = SHORTCUT_GROUPS.flatMap((group) => group.items)
const interactiveItems = items.filter((item) => item.replayable !== false)
const plainItems = items.filter((item) => item.replayable === false)
const allKeys = (list: typeof items) => list.reduce((count, item) => count + item.keys.length, 0)

const renderList = (canApply = { editor: true, app: true }, onApply = vi.fn()) => {
  render(<ShortcutsList canApply={canApply} onApply={onApply} />)
  return onApply
}

const rowOf = (label: string) => screen.getByText(label).closest('li') as HTMLElement

describe('ShortcutsList', () => {
  it('renders both group labels', () => {
    renderList()
    for (const group of SHORTCUT_GROUPS) {
      expect(screen.getByText(group.heading)).toBeTruthy()
    }
  })

  it('renders every entry with its key tokens', () => {
    const { container } = render(
      <ShortcutsList canApply={{ editor: true, app: true }} onApply={() => {}} />,
    )
    for (const item of items) {
      expect(screen.getByText(item.label)).toBeTruthy()
    }
    // One chip per listed key, and the tokens render through displayKeys.
    const chips = container.querySelectorAll('kbd')
    expect(chips).toHaveLength(allKeys(items))
    expect(container.textContent).toContain(displayKeys('Mod-b'))
    expect(container.textContent).toContain(displayKeys('Mod-k'))
  })

  it('lists one row per heading level', () => {
    renderList()
    for (let level = 1; level <= 6; level += 1) {
      const row = rowOf(`Heading ${level}`)
      expect(row.querySelectorAll('kbd')).toHaveLength(1)
      expect(within(row).getByText(displayKeys(`Mod-Alt-${level}`))).toBeTruthy()
    }
    expect(screen.queryByText('Heading 1-6')).toBeNull()
  })

  it('makes one control per bound key combination', () => {
    renderList()
    // Every bound combination is a control; a row listing two offers two.
    expect(screen.getAllByRole('button')).toHaveLength(allKeys(interactiveItems))
  })

  it('names each control by its action and its keys', () => {
    renderList()
    expect(screen.getByRole('button', { name: 'Bold Ctrl+B' })).toBeTruthy()
    // A two-chord row yields two distinctly named controls.
    expect(screen.getByRole('button', { name: 'Redo Ctrl+Y' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Redo Shift+Ctrl+Z' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Search notes Ctrl+K' })).toBeTruthy()
  })

  // jsdom resolves no stylesheets, so this is a structural guard rather than a
  // layout one: the chip's font and padding sit on the element that is the chip
  // — the <button> for a bound row, the <kbd> itself otherwise — and a browser
  // showed the cost of getting that wrong. An inner <kbd> left uncovered falls
  // back to the browser's monospace default, a wider font that wrapped the
  // widest row ("Outdent list item") onto two lines.
  it('covers every key label with the chip styling', () => {
    const { container } = render(
      <ShortcutsList canApply={{ editor: true, app: true }} onApply={() => {}} />,
    )
    const labels = [...container.querySelectorAll('kbd')]
    expect(labels).toHaveLength(allKeys(items))
    for (const label of labels) {
      const covered =
        label.classList.contains(styles.kbd) || label.parentElement?.classList.contains(styles.kbd)
      expect(covered, `${label.textContent} carries no chip styling`).toBe(true)
    }
  })

  it('leaves a row whose chord is not a keydown binding as a plain label', () => {
    renderList()
    expect(plainItems).toHaveLength(1)
    const row = rowOf('Paste as plain text')
    expect(within(row).queryByRole('button')).toBeNull()
    expect(row.querySelectorAll('kbd')).toHaveLength(1)
  })

  it('applies the chord and its surface when a control is activated', () => {
    const onApply = renderList()
    fireEvent.click(screen.getByRole('button', { name: 'Bold Ctrl+B' }))
    expect(onApply).toHaveBeenCalledWith('Mod-b', 'editor')
    fireEvent.click(screen.getByRole('button', { name: 'Search notes Ctrl+K' }))
    expect(onApply).toHaveBeenCalledWith('Mod-k', 'app')
  })

  it('disables the rows whose surface is unavailable and leaves the others live', () => {
    renderList({ editor: false, app: true })
    expect(
      (screen.getByRole('button', { name: 'Bold Ctrl+B' }) as HTMLButtonElement).disabled,
    ).toBe(true)
    expect(
      (screen.getByRole('button', { name: 'Search notes Ctrl+K' }) as HTMLButtonElement).disabled,
    ).toBe(false)
    // Disabled rows stay listed: the reference is present in every state.
    for (const item of interactiveItems) expect(screen.getByText(item.label)).toBeTruthy()
  })

  it('lists only real shortcuts — links and strikethrough have no keymap', () => {
    renderList()
    expect(screen.queryByText('Link')).toBeNull()
    expect(screen.queryByText('Strikethrough')).toBeNull()
  })

  it('is not exposed as a dialog', () => {
    renderList()
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('uses no headings — the chrome has none and the summary is not one', () => {
    renderList()
    expect(screen.queryByRole('heading')).toBeNull()
  })

  it('labels each group section for assistive technology', () => {
    const { container } = render(
      <ShortcutsList canApply={{ editor: true, app: true }} onApply={() => {}} />,
    )
    const sections = container.querySelectorAll('section')
    expect(sections).toHaveLength(SHORTCUT_GROUPS.length)
    for (const section of sections) {
      const labelId = section.getAttribute('aria-labelledby')
      expect(labelId).toBeTruthy()
      expect(document.getElementById(labelId as string)?.textContent).toBeTruthy()
    }
  })
})
