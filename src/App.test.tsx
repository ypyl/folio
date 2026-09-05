import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import App from './App'
import { Accordion } from './components/Accordion'

const pane = () => screen.getByRole('main')

describe('application shell', () => {
  it('renders the shell chrome', () => {
    render(<App />)
    expect(within(screen.getByRole('banner')).getByText('Folio')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'New Page' })).toBeTruthy()
    expect(screen.getByLabelText('Search notes')).toBeTruthy()
    expect(screen.getByText('Journal')).toBeTruthy()
    expect(screen.getByText('Pages')).toBeTruthy()
    expect(screen.getByText('Backlinks')).toBeTruthy()
    expect(screen.getByText('Your notes appear here.')).toBeTruthy()
  })

  it('renders an Accordion without defaultOpen closed by default', () => {
    const { container } = render(<Accordion title="Collapsible">hidden body</Accordion>)
    const details = container.querySelector('details') as HTMLDetailsElement
    expect(details.open).toBe(false)
  })
})

describe('static navigation', () => {
  it('loads to the empty state with no active row', () => {
    render(<App />)
    expect(screen.getByText('Your notes appear here.')).toBeTruthy()
    expect(screen.queryAllByRole('button', { name: /current/ })).toHaveLength(0)
  })

  it('lists mock pages and journal entries in the sidebar', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: 'Welcome' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Reading' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '2026-09-02' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '2026-09-04' })).toBeTruthy()
  })

  it('clicking a page row opens it and marks it active', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Welcome' }))
    expect(screen.queryByText('Your notes appear here.')).toBeNull()
    expect(
      within(pane()).getByRole('heading', { level: 1, name: 'Welcome' }),
    ).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Welcome' }).getAttribute('aria-current'),
    ).toBe('page')
  })

  it('clicking a journal entry opens it like a page', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '2026-09-03' }))
    expect(
      within(pane()).getByRole('heading', { level: 1, name: '2026-09-03' }),
    ).toBeTruthy()
  })

  it('clicking a second row swaps content and moves the active marker', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Welcome' }))
    fireEvent.click(screen.getByRole('button', { name: 'Reading' }))
    expect(
      within(pane()).getByRole('heading', { level: 1, name: 'Reading' }),
    ).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Reading' }).getAttribute('aria-current'),
    ).toBe('page')
    expect(
      screen.getByRole('button', { name: 'Welcome' }).getAttribute('aria-current'),
    ).toBeNull()
  })

  it('keeps meta panel placeholders while a page is open', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Welcome' }))
    expect(
      screen.getByText('Pages linking to this one appear once a page is open.'),
    ).toBeTruthy()
    expect(
      screen.getByText('Links from this page appear once a page is open.'),
    ).toBeTruthy()
  })

  it('renders reference chips as inert in the open page', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Welcome' }))
    const chip = within(pane()).getByText('Inbox')
    fireEvent.click(chip)
    expect(
      within(pane()).getByRole('heading', { level: 1, name: 'Welcome' }),
    ).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Welcome' }).getAttribute('aria-current'),
    ).toBe('page')
  })
})