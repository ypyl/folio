import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { Header } from './Header'

describe('header', () => {
  it('renders the active vault name and file count as text, not a folder button', () => {
    render(<Header vaultName="notes" fileCount={12} />)
    const status = screen.getByTitle('notes (12 files)')
    expect(status.textContent).toContain('notes')
    expect(status.textContent).toContain('· 12')
    // the slot is display-only: it performs no folder action
    expect(screen.queryByRole('button', { name: 'Open folder' })).toBeNull()
  })

  it('shows the keyboard-shortcuts button without a vault', () => {
    render(<Header />)
    expect(screen.getByRole('button', { name: 'Keyboard shortcuts' })).toBeTruthy()
    expect(screen.queryByTitle(/files/)).toBeNull()
  })

  it('shows the keyboard-shortcuts button beside the vault status', () => {
    render(<Header vaultName="notes" fileCount={12} />)
    expect(screen.getByRole('button', { name: 'Keyboard shortcuts' })).toBeTruthy()
    expect(screen.getByTitle('notes (12 files)')).toBeTruthy()
  })

  it('the keyboard-shortcuts button fires onHelp', () => {
    const onHelp = vi.fn()
    render(<Header onHelp={onHelp} />)
    fireEvent.click(screen.getByRole('button', { name: 'Keyboard shortcuts' }))
    expect(onHelp).toHaveBeenCalled()
  })

  it('the brand is a home control that fires onHome', () => {
    const onHome = vi.fn()
    render(<Header onHome={onHome} />)
    const brand = screen.getByRole('button', { name: /go home/i })
    expect(brand).toBeTruthy()
    fireEvent.click(brand)
    expect(onHome).toHaveBeenCalled()
  })

  it('the brand is clickable whether or not a vault is active', () => {
    const onHome = vi.fn()
    render(<Header vaultName="notes" fileCount={3} onHome={onHome} />)
    fireEvent.click(screen.getByRole('button', { name: /go home/i }))
    expect(onHome).toHaveBeenCalled()
  })
})
