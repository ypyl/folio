// The compact navigation bar (give-the-phone-a-navigation-bar, design D1): three
// equal destinations, the shown one marked by the indicator and aria-current.
// jsdom has no layout, so the 64px bar and the equal thirds are checked in the
// browser; what these hold is what renders and what it reports.

import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CompactNavBar } from './CompactNavBar'
import styles from './CompactNavBar.module.css'

describe('the compact navigation bar', () => {
  it('shows the three destinations in order', () => {
    render(<CompactNavBar view="editor" onSelect={() => {}} />)
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual([
      'Notes',
      'Page',
      'Details',
    ])
    expect(screen.getByRole('navigation', { name: 'Views' })).toBeTruthy()
  })

  it('marks exactly the shown destination', () => {
    const { container, rerender } = render(<CompactNavBar view="meta" onSelect={() => {}} />)
    const active = () =>
      [...container.querySelectorAll('button')].filter(
        (b) => b.getAttribute('aria-current') === 'page',
      )
    expect(active().map((b) => b.textContent)).toEqual(['Details'])
    // The indicator is the shape signal, on the active destination alone.
    expect(container.querySelectorAll(`.${styles.active}`)).toHaveLength(1)

    rerender(<CompactNavBar view="nav" onSelect={() => {}} />)
    expect(active().map((b) => b.textContent)).toEqual(['Notes'])
    expect(container.querySelectorAll(`.${styles.active}`)).toHaveLength(1)
  })

  it('reports the destination selected', () => {
    const onSelect = vi.fn()
    render(<CompactNavBar view="editor" onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('button', { name: 'Details' }))
    expect(onSelect).toHaveBeenCalledWith('meta')
    fireEvent.click(screen.getByRole('button', { name: 'Notes' }))
    expect(onSelect).toHaveBeenLastCalledWith('nav')
  })
})
