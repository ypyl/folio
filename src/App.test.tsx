import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App'
import { Accordion } from './components/Accordion'

describe('application shell', () => {
  it('renders the shell chrome', () => {
    render(<App />)
    expect(screen.getByText('Folio')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'New Page' })).toBeTruthy()
    expect(screen.getByLabelText('Search notes')).toBeTruthy()
    expect(screen.getByText('Journal')).toBeTruthy()
    expect(screen.getByText('Pages')).toBeTruthy()
    expect(screen.getByText('Backlinks')).toBeTruthy()
    expect(screen.getByText('Your notes appear here.')).toBeTruthy()
  })

  it('shows placeholder copy in the journal and meta sections', () => {
    render(<App />)
    expect(
      screen.getByText('The calendar arrives with the journal step.'),
    ).toBeTruthy()
    expect(
      screen.getByText('Pages linking to this one appear once a page is open.'),
    ).toBeTruthy()
  })

  it('renders an Accordion without defaultOpen closed by default', () => {
    const { container } = render(<Accordion title="Collapsible">hidden body</Accordion>)
    const details = container.querySelector('details') as HTMLDetailsElement
    expect(details.open).toBe(false)
  })
})