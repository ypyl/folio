import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import App from './App'
import { Accordion } from './components/Accordion'
import { buildTree } from './vault/fakeHandle'

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

describe('folder rail flow', () => {
  it('shows the Add folder button in mock state', async () => {
    render(<App />)
    expect(await screen.findByRole('button', { name: 'Add folder' })).toBeTruthy()
  })

  it('adds a picked folder and shows its status in the header slot', async () => {
    const tree = buildTree({ 'a.md': 'a' })
    tree.name = 'notes'
    vi.stubGlobal('showDirectoryPicker', vi.fn(async () => tree as unknown as FileSystemDirectoryHandle))
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'Add folder' }))
    expect(await screen.findByRole('button', { name: 'Open folder notes' })).toBeTruthy()
    expect(await screen.findByTitle('notes (1 files)')).toBeTruthy()
    vi.unstubAllGlobals()
  })

  it('switching folders resets the open page', async () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Welcome' }))
    expect(
      within(pane()).getByRole('heading', { level: 1, name: 'Welcome' }),
    ).toBeTruthy()
    const a = buildTree({ 'a.md': 'a' })
    a.name = 'Work'
    const b = buildTree({ 'b.md': 'b' })
    b.name = 'Home'
    vi.stubGlobal(
      'showDirectoryPicker',
      vi
        .fn()
        .mockResolvedValueOnce(a as unknown as FileSystemDirectoryHandle)
        .mockResolvedValueOnce(b as unknown as FileSystemDirectoryHandle),
    )
    fireEvent.click(await screen.findByRole('button', { name: 'Add folder' }))
    // re-clicking the active folder is not a switch: page stays
    fireEvent.click(await screen.findByRole('button', { name: 'Open folder Work' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Add folder' }))
    // switching to a different folder resets the page
    fireEvent.click(await screen.findByRole('button', { name: 'Open folder Home' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Open folder Work' }))
    expect(
      within(pane()).getByText('Your notes appear here.'),
    ).toBeTruthy()
    expect(
      within(pane()).queryByRole('heading', { level: 1, name: 'Welcome' }),
    ).toBeNull()
    vi.unstubAllGlobals()
  })
})