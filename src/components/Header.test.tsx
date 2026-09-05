import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Header } from './Header'

describe('header slot (display-only)', () => {
  it('renders the active vault name and file count as text, not a button', () => {
    render(<Header vaultName="notes" fileCount={12} />)
    const status = screen.getByTitle('notes (12 files)')
    expect(status.textContent).toContain('notes')
    expect(status.textContent).toContain('· 12')
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('renders nothing in the slot without an open vault', () => {
    render(<Header />)
    expect(screen.queryByTitle(/files/)).toBeNull()
  })
})