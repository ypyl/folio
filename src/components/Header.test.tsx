import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Header } from './Header'

describe('header', () => {
  it('the brand is a home control that fires onHome', () => {
    const onHome = vi.fn()
    render(<Header onHome={onHome} />)
    const brand = screen.getByRole('button', { name: /go home/i })
    expect(brand).toBeTruthy()
    fireEvent.click(brand)
    expect(onHome).toHaveBeenCalled()
  })

  it('the brand is clickable and the slot is empty', () => {
    const onHome = vi.fn()
    render(<Header onHome={onHome} />)
    // The header no longer owns the vault status or the help button — those
    // moved to the status bar (add-status-bar). No help button remains here.
    expect(screen.queryByRole('button', { name: 'Keyboard shortcuts' })).toBeNull()
    expect(screen.queryByTitle(/files/)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /go home/i }))
    expect(onHome).toHaveBeenCalled()
  })
})
