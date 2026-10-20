import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { RowContextMenu, type RowMenuItem } from './RowContextMenu'

// The page-row context menu (add-row-context-menu, row-context-menu spec): a
// fixed two-item popover with a defined open/dismiss/keyboard contract.

const items = (onFavorite = vi.fn(), onPresent = vi.fn()): RowMenuItem[] => [
  { label: 'Favorite', onSelect: onFavorite },
  { label: 'Present', onSelect: onPresent },
]

const open = (props: Partial<Parameters<typeof RowContextMenu>[0]> = {}) =>
  render(
    <RowContextMenu
      x={40}
      y={40}
      items={items()}
      restoreFocusTo={null}
      onClose={() => {}}
      {...props}
    />,
  )

describe('RowContextMenu', () => {
  it('renders exactly the two items and focuses the first on open', () => {
    open()
    const menu = screen.getByRole('menu')
    expect(
      within(menu)
        .getAllByRole('menuitem')
        .map((b) => b.textContent),
    ).toEqual(['Favorite', 'Present'])
    expect(document.activeElement).toBe(within(menu).getByRole('menuitem', { name: 'Favorite' }))
  })

  it('shifts its box back inside the viewport when invoked near an edge', () => {
    open({ x: 100000, y: 100000 })
    const menu = screen.getByRole('menu')
    expect(parseFloat(menu.style.left)).toBeLessThan(window.innerWidth)
    expect(parseFloat(menu.style.top)).toBeLessThan(window.innerHeight)
  })

  it('closes on Escape and returns focus to the row', () => {
    const onClose = vi.fn()
    const row = document.createElement('button')
    document.body.appendChild(row)
    const { unmount } = open({ restoreFocusTo: row, onClose })

    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)

    // Focus comes back on the way out, not while the menu is still mounted.
    unmount()
    expect(document.activeElement).toBe(row)
    row.remove()
  })

  it('closes on a pointer press outside the box and on a scroll', () => {
    const onClose = vi.fn()
    open({ onClose })

    fireEvent.pointerDown(document.body)
    expect(onClose).toHaveBeenCalledTimes(1)

    fireEvent.scroll(document.body)
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('moves between items with the arrow keys, without wrapping', () => {
    open()
    const menu = screen.getByRole('menu')
    const [favorite, present] = within(menu).getAllByRole('menuitem')

    fireEvent.keyDown(menu, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(present)
    fireEvent.keyDown(menu, { key: 'ArrowDown' })
    expect(document.activeElement).toBe(present) // the last item stops here
    fireEvent.keyDown(menu, { key: 'ArrowUp' })
    expect(document.activeElement).toBe(favorite)
    fireEvent.keyDown(menu, { key: 'End' })
    expect(document.activeElement).toBe(present)
    fireEvent.keyDown(menu, { key: 'Home' })
    expect(document.activeElement).toBe(favorite)
  })

  it('runs an item and closes when it is activated', () => {
    const onFavorite = vi.fn()
    const onPresent = vi.fn()
    const onClose = vi.fn()
    open({ items: items(onFavorite, onPresent), onClose })

    fireEvent.click(screen.getByRole('menuitem', { name: 'Present' }))
    expect(onPresent).toHaveBeenCalledTimes(1)
    expect(onFavorite).not.toHaveBeenCalled()
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe('RowContextMenu heading (add-reminder-menu-heading)', () => {
  it('renders an optional heading as a labelled group, not a menuitem', () => {
    open({ heading: 'Reminder' })
    const menu = screen.getByRole('menu')
    const group = within(menu).getByRole('group', { name: 'Reminder' })
    expect(within(group).getAllByRole('menuitem')).toHaveLength(2)
    expect(within(menu).queryByRole('menuitem', { name: 'Reminder' })).toBeNull()
    expect(within(group).getByText('Reminder')).toBeTruthy()
  })

  it('renders no group without a heading', () => {
    open()
    expect(screen.queryByRole('group')).toBeNull()
  })
})

// A shown-but-unavailable item (disable-once-for-past-days): the `Once, on this
// day` reminder on a past day. It keeps its place, the platform refuses it, and
// the menu's own focus movement steps over it.
describe('RowContextMenu disabled item (disable-once-for-past-days)', () => {
  const dayItems = (onOnce = vi.fn(), onDaily = vi.fn()): RowMenuItem[] => [
    { label: 'Once, on this day', onSelect: onOnce, disabled: true },
    { label: 'Every day', onSelect: onDaily },
  ]

  it('renders it in place, disabled, and focuses the first available item', () => {
    open({ items: dayItems() })
    const menu = screen.getByRole('menu')
    const [once, daily] = within(menu).getAllByRole('menuitem')
    expect((once as HTMLButtonElement).disabled).toBe(true)
    expect((daily as HTMLButtonElement).disabled).toBe(false)
    expect(document.activeElement).toBe(daily)
  })

  it('leaves it out of the arrow-key and Home/End sequence', () => {
    open({ items: dayItems() })
    const menu = screen.getByRole('menu')
    const daily = within(menu).getByRole('menuitem', { name: 'Every day' })
    for (const key of ['ArrowUp', 'ArrowDown', 'Home', 'End']) {
      fireEvent.keyDown(menu, { key })
      expect(document.activeElement).toBe(daily)
    }
  })

  it('focuses the menu box itself when every item is disabled', () => {
    open({ items: [{ label: 'Once, on this day', onSelect: vi.fn(), disabled: true }] })
    expect(document.activeElement).toBe(screen.getByRole('menu'))
  })
})
