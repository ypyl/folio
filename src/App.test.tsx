import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import App from './App'
import { Accordion } from './components/Accordion'
import { buildTree } from './vault/fakeHandle'

const pane = () => screen.getByRole('main')

// Test fixture: the former mock-vault content lifted into real .md files
// (the promised scan/index fixture). 5 pages + 3 journals = 8 files.
const FIXTURE = {
  'Welcome.md':
    'This is Folio, a lightweight way to work with a folder of Markdown notes.' +
    'The folder is your library; this app is just a window over it.\n\n' +
    'Open a note from the sidebar, or read the #Inbox to see what arrived.\n\n#notes #intro',
  'Inbox.md':
    'A place to drop thoughts before they find a home.\n\n' +
    '- Review the #Reading list\n- Draft a project page for #Folio\n\n#inbox #capture',
  'Ideas.md':
    'Half-formed thoughts worth keeping.\n\n' +
    '- #Folio could show daily notes in a calendar\n' +
    '- Backlinks make old notes resurface naturally\n- A #word is just a link to a page\n\n#ideas',
  'Folio.md':
    'Notes on building Folio itself.\n\n' +
    'Design principles live in the #architecture notes. The whole vault is a folder of Markdown files - no backend, no database.\n\n' +
    'See #Ideas for what might come next, and #Welcome to start again.',
  'Reading.md':
    'A running list of things to read.\n\n' +
    '- Essays on plain text and durable notes\n- Local-first software, why it matters\n\n#reading #[[reading list]]',
  journals: {
    '2026-09-02.md': 'Started a fresh vault. First note: #Welcome.',
    '2026-09-03.md': 'Sketching how backlinks should behave. Added to #Ideas.',
    '2026-09-04.md': 'Built the shell. Next: make it navigable. Noted #architecture.',
  },
}

async function openFixture(): Promise<void> {
  const tree = buildTree(FIXTURE)
  tree.name = 'notes'
  vi.stubGlobal(
    'showDirectoryPicker',
    vi.fn(async () => tree as unknown as FileSystemDirectoryHandle),
  )
  fireEvent.click(await screen.findByRole('button', { name: 'Add folder' }))
}

describe('application shell', () => {
  it('renders the shell chrome with the open-a-folder empty state', async () => {
    render(<App />)
    expect(within(screen.getByRole('banner')).getByText('Folio')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'New Page' })).toBeTruthy()
    expect(screen.getByLabelText('Search notes')).toBeTruthy()
    expect(screen.getByText('Journal')).toBeTruthy()
    expect(screen.getByText('Pages')).toBeTruthy()
    expect(screen.getByText('Backlinks')).toBeTruthy()
    // Restore resolves async; once no folder is present the hint settles.
    expect(await screen.findByText('Open a folder to begin.')).toBeTruthy()
  })

  it('shows empty sidebar sections before a folder is opened', () => {
    render(<App />)
    expect(screen.queryByRole('button', { name: 'Welcome' })).toBeNull()
  })

  it('renders an Accordion without defaultOpen closed by default', () => {
    const { container } = render(<Accordion title="Collapsible">hidden body</Accordion>)
    const details = container.querySelector('details') as HTMLDetailsElement
    expect(details.open).toBe(false)
  })
})

describe('navigation over the real index', () => {
  it('lists vault pages and journal entries from the open folder', async () => {
    render(<App />)
    await openFixture()
    expect(await screen.findByRole('button', { name: 'Welcome' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Reading' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '2026-09-02' })).toBeTruthy()
    expect(screen.getByRole('button', { name: '2026-09-04' })).toBeTruthy()
    vi.unstubAllGlobals()
  })

  it('shows the brand empty state with a folder open but nothing selected', async () => {
    render(<App />)
    await openFixture()
    expect(await screen.findByText('Your notes appear here.')).toBeTruthy()
    vi.unstubAllGlobals()
  })

  it('lists the live file count in the header', async () => {
    render(<App />)
    await openFixture()
    expect(await screen.findByTitle('notes (8 files)')).toBeTruthy()
    vi.unstubAllGlobals()
  })

  it('clicking a page row opens it and marks it active', async () => {
    render(<App />)
    await openFixture()
    const row = await screen.findByRole('button', { name: 'Welcome' })
    fireEvent.click(row)
    expect(screen.queryByText('Your notes appear here.')).toBeNull()
    expect(
      within(pane()).getByRole('heading', { level: 1, name: 'Welcome' }),
    ).toBeTruthy()
    expect(row.getAttribute('aria-current')).toBe('page')
    vi.unstubAllGlobals()
  })

  it('clicking a journal entry opens it like a page', async () => {
    render(<App />)
    await openFixture()
    fireEvent.click(await screen.findByRole('button', { name: '2026-09-03' }))
    expect(
      within(pane()).getByRole('heading', { level: 1, name: '2026-09-03' }),
    ).toBeTruthy()
    vi.unstubAllGlobals()
  })

  it('clicking a second row swaps content and moves the active marker', async () => {
    render(<App />)
    await openFixture()
    fireEvent.click(await screen.findByRole('button', { name: 'Welcome' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Reading' }))
    expect(
      within(pane()).getByRole('heading', { level: 1, name: 'Reading' }),
    ).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Reading' }).getAttribute('aria-current'),
    ).toBe('page')
    expect(
      screen.getByRole('button', { name: 'Welcome' }).getAttribute('aria-current'),
    ).toBeNull()
    vi.unstubAllGlobals()
  })

  it('keeps meta panel placeholders while a page is open', async () => {
    render(<App />)
    await openFixture()
    fireEvent.click(await screen.findByRole('button', { name: 'Welcome' }))
    expect(
      screen.getByText('Pages linking to this one appear once a page is open.'),
    ).toBeTruthy()
    expect(
      screen.getByText('Links from this page appear once a page is open.'),
    ).toBeTruthy()
    vi.unstubAllGlobals()
  })

  it('renders reference chips as inert in the open page', async () => {
    render(<App />)
    await openFixture()
    fireEvent.click(await screen.findByRole('button', { name: 'Welcome' }))
    const chip = within(pane()).getByText('Inbox')
    fireEvent.click(chip)
    expect(
      within(pane()).getByRole('heading', { level: 1, name: 'Welcome' }),
    ).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'Welcome' }).getAttribute('aria-current'),
    ).toBe('page')
    vi.unstubAllGlobals()
  })
})

describe('folder rail flow', () => {
  it('shows the Add folder button before any folder opens', async () => {
    render(<App />)
    expect(await screen.findByRole('button', { name: 'Add folder' })).toBeTruthy()
  })

  it('switching folders resets the open page; re-clicking the active folder keeps it', async () => {
    render(<App />)
    await openFixture()
    fireEvent.click(await screen.findByRole('button', { name: 'Welcome' }))
    expect(
      within(pane()).getByRole('heading', { level: 1, name: 'Welcome' }),
    ).toBeTruthy()

    const home = buildTree({ 'b.md': 'b' })
    home.name = 'Home'
    vi.stubGlobal(
      'showDirectoryPicker',
      vi.fn(async () => home as unknown as FileSystemDirectoryHandle),
    )
    // Re-clicking the active folder is not a switch: page stays.
    fireEvent.click(await screen.findByRole('button', { name: 'Open folder notes' }))
    expect(
      within(pane()).getByRole('heading', { level: 1, name: 'Welcome' }),
    ).toBeTruthy()

    // Adding a second folder is not a switch either.
    fireEvent.click(await screen.findByRole('button', { name: 'Add folder' }))
    expect(await screen.findByRole('button', { name: 'b' })).toBeTruthy()

    // Switching to a different folder resets the page.
    fireEvent.click(await screen.findByRole('button', { name: 'Open folder Home' }))
    expect(within(pane()).getByText('Your notes appear here.')).toBeTruthy()
    expect(
      within(pane()).queryByRole('heading', { level: 1, name: 'Welcome' }),
    ).toBeNull()
    vi.unstubAllGlobals()
  })
})