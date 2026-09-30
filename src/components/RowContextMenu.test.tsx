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
