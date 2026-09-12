import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Header } from './Header'
import { version } from '../../package.json'

describe('header', () => {
  it('the brand is a home control that fires onHome', () => {
    const onHome = vi.fn()
    render(<Header onHome={onHome} />)
    const brand = screen.getByRole('button', { name: /go home/i })
    expect(brand).toBeTruthy()
    fireEvent.click(brand)
    expect(onHome).toHaveBeenCalled()
  })

  it('keeps no help button or vault status in the header', () => {
    const onHome = vi.fn()
    render(<Header onHome={onHome} />)
    // The header no longer owns the vault status or the help button — those
    // moved to the status bar (add-status-bar). No help button remains here.
    expect(screen.queryByRole('button', { name: 'Keyboard shortcuts' })).toBeNull()
    expect(screen.queryByTitle(/files/)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /go home/i }))
    expect(onHome).toHaveBeenCalled()
  })

  it('shows the running version beside the brand', () => {
    render(<Header onHome={vi.fn()} search={<span />} />)
    expect(screen.getByText(`v${version}`)).toBeTruthy()
  })

  it('shows the version as plain text, not a control', () => {
    // Both props are optional, so the bare header must still carry the badge
    // (add-version-badge: it renders in every app state).
    render(<Header />)
    const badge = screen.getByText(`v${version}`)
    expect(badge.tagName).toBe('SPAN')
    expect(screen.getAllByRole('button')).toHaveLength(1)
  })
})
