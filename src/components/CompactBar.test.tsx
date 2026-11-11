// The compact app bar (make-the-phone-read-like-an-app, design D3): a title that
// becomes a control where locating applies, and the open page's actions at the
// trailing edge. jsdom has no layout, so the title's size and the bar's height
// are checked in the browser; what these hold is what renders and what it does.

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CompactBar } from './CompactBar'

describe('the compact app bar', () => {
  it('shows a text title when the item cannot be located', () => {
    render(<CompactBar title="Folio" />)
    expect(screen.getByText('Folio')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Folio' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Page actions' })).toBeNull()
  })

  it('makes the title a control that locates the open item', () => {
    const locate = vi.fn()
    render(<CompactBar title="Alpha" titleAction={locate} titleLabel="Reveal Alpha in Files" />)
    fireEvent.click(screen.getByRole('button', { name: 'Reveal Alpha in Files' }))
    expect(locate).toHaveBeenCalledTimes(1)
  })

  it('opens the page actions at the control', () => {
    const onFavorite = vi.fn()
    const onPresent = vi.fn()
    render(
      <CompactBar
        title="Alpha"
        actions={[
          { label: 'Favorite', onSelect: onFavorite },
          { label: 'Present', onSelect: onPresent },
        ]}
      />,
    )
    const trigger = screen.getByRole('button', { name: 'Page actions' })
    expect(trigger.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(trigger)
    expect(trigger.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByRole('menuitem', { name: 'Favorite' })).toBeTruthy()
    fireEvent.click(screen.getByRole('menuitem', { name: 'Present' }))
    expect(onPresent).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('draws no actions control when the open item has no row actions', () => {
    render(<CompactBar title="2026-09-15" actions={[]} />)
    expect(screen.queryByRole('button', { name: 'Page actions' })).toBeNull()
  })
})
