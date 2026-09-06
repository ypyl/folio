import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import App from './App'
import { Accordion } from './components/Accordion'
import { FakeFileHandle, buildTree, type FakeDirectoryHandle } from './vault/fakeHandle'
import { FileSystemVaultStorage } from './vault/fs'
import type { EditorAdapter } from './editor/editor'

// Replace the real ProseMirror transport with FakeEditor for App-level tests
// (design D1). Instances are registered so tests can drive edits and assert
// what each page's editor was seeded with.
const editorInstances = vi.hoisted(() => ({ list: [] as EditorAdapter[] }))
vi.mock('./editor/milkdown', async () => {
  const { FakeEditor } = await import('./editor/fakeEditor')
  return {
    MilkdownAdapter: class extends FakeEditor {
      constructor() {
        super()
        editorInstances.list.push(this)
      }
    },
  }
})

type FakeView = EditorAdapter & {
  setContents: string[]
  insertions: string[]
  emitChange: (markdown: string) => void
}

// The most recently mounted editor instance.
const editor = () => editorInstances.list[editorInstances.list.length - 1] as FakeView

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

async function openFixture(): Promise<FakeDirectoryHandle> {
  const tree = buildTree(FIXTURE)
  tree.name = 'notes'
  vi.stubGlobal(
    'showDirectoryPicker',
    vi.fn(async () => tree as unknown as FileSystemDirectoryHandle),
  )
  fireEvent.click(await screen.findByRole('button', { name: 'Add folder' }))
  editorInstances.list.length = 0 // fresh editors per test
  return tree
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
    // The pane shows only the file content: no title heading, editor seeded.
    expect(within(pane()).queryByRole('heading', { level: 1 })).toBeNull()
    await waitFor(() =>
      expect(editor().setContents[0]).toContain('Open a note from the sidebar'),
    )
    expect(row.getAttribute('aria-current')).toBe('page')
    vi.unstubAllGlobals()
  })

  it('clicking a journal entry opens it like a page', async () => {
    render(<App />)
    await openFixture()
    fireEvent.click(await screen.findByRole('button', { name: '2026-09-03' }))
    expect(within(pane()).queryByRole('heading', { level: 1 })).toBeNull()
    await waitFor(() =>
      expect(editor().setContents[0]).toContain('Sketching how backlinks should behave'),
    )
    vi.unstubAllGlobals()
  })

  it('clicking a second row swaps content and moves the active marker', async () => {
    render(<App />)
    await openFixture()
    fireEvent.click(await screen.findByRole('button', { name: 'Welcome' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Reading' }))
    expect(within(pane()).queryByRole('heading', { level: 1 })).toBeNull()
    await waitFor(() =>
      expect(editor().setContents[0]).toContain('A running list of things to read'),
    )
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

  it('seeds the editor with the open page content (references are plain text)', async () => {
    render(<App />)
    await openFixture()
    fireEvent.click(await screen.findByRole('button', { name: 'Welcome' }))
    const fake = editor()
    // The editor is seeded with the page's Markdown, reference tokens intact
    // as plain editable text (page-editing spec) — no chip rendering.
    await waitFor(() => expect(fake.setContents[0]).toContain('#Inbox'))
    expect(fake.setContents[0]).toContain('This is Folio')
    vi.unstubAllGlobals()
  })
})

describe('auto-save (page-editing spec)', () => {
  it('type -> pause -> save writes through and clears the indicator', async () => {
    render(<App />)
    const tree = await openFixture()
    fireEvent.click(await screen.findByRole('button', { name: 'Welcome' }))
    editor().emitChange('edited welcome body')

    const status = await screen.findByRole('status')
    expect(status.textContent).toBe('Unsaved changes')

    // After the ~1s debounce the file is written and the indicator clears.
    await waitFor(() => expect(screen.queryByRole('status')).toBeNull(), { timeout: 3000 })
    const file = tree.children.get('Welcome.md') as FakeFileHandle
    expect(await (await file.getFile()).text()).toBe('edited welcome body')
    vi.unstubAllGlobals()
  })

  it('leaving a page before the save keeps the draft and restores it on return', async () => {
    render(<App />)
    await openFixture()
    fireEvent.click(await screen.findByRole('button', { name: 'Welcome' }))
    editor().emitChange('draft of welcome')
    fireEvent.click(await screen.findByRole('button', { name: 'Reading' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Welcome' }))

    // The fresh Welcome editor mounts with the draft, not the indexed content.
    const reopened = editor()
    await waitFor(() => expect(reopened.setContents[0]).toBe('draft of welcome'))
    vi.unstubAllGlobals()
  })

  it('a failed save keeps the page dirty and re-arms on the next edit', async () => {
    render(<App />)
    const tree = await openFixture()
    fireEvent.click(await screen.findByRole('button', { name: 'Welcome' }))
    const spy = vi
      .spyOn(FileSystemVaultStorage.prototype, 'write')
      .mockRejectedValueOnce(new DOMException('denied', 'SecurityError'))

    editor().emitChange('first edit')
    expect(await screen.findByText('Save failed', {}, { timeout: 3000 })).toBeTruthy()
    expect(editor()).toBeTruthy()

    spy.mockRestore()
    editor().emitChange('second edit')
    await waitFor(() => expect(screen.queryByRole('status')).toBeNull(), { timeout: 3000 })
    const file = tree.children.get('Welcome.md') as FakeFileHandle
    expect(await (await file.getFile()).text()).toBe('second edit')
    vi.unstubAllGlobals()
  })
})

describe('asset drag & drop (page-editing spec)', () => {
  it('copies a dropped image into assets/ and inserts its link at the cursor', async () => {
    render(<App />)
    const tree = await openFixture()
    fireEvent.click(await screen.findByRole('button', { name: 'Welcome' }))

    const dataTransfer = {
      files: [new File(['imgbytes'], 'photo.png', { type: 'image/png' })],
      items: [
        {
          kind: 'file',
          getAsFile: () => new File(['imgbytes'], 'photo.png', { type: 'image/png' }),
        },
      ],
    }
    fireEvent.drop(pane(), { dataTransfer })

    await waitFor(() =>
      expect(editor().insertions).toContain('![photo](assets/photo.png)'),
    )
    const assetsDir = tree.children.get('assets') as FakeDirectoryHandle
    expect(assetsDir).toBeTruthy()
    const file = assetsDir.children.get('photo.png') as FakeFileHandle
    expect(await (await file.getFile()).text()).toBe('imgbytes')
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
    expect(within(pane()).queryByRole('heading', { level: 1 })).toBeNull()
    await waitFor(() => expect(editor().setContents[0]).toContain('This is Folio'))

    const home = buildTree({ 'b.md': 'b' })
    home.name = 'Home'
    vi.stubGlobal(
      'showDirectoryPicker',
      vi.fn(async () => home as unknown as FileSystemDirectoryHandle),
    )
    // Re-clicking the active folder is not a switch: page stays.
    fireEvent.click(await screen.findByRole('button', { name: 'Open folder notes' }))
    // Re-clicking the active folder is not a switch: the same page stays.
    expect(within(pane()).queryByRole('heading', { level: 1 })).toBeNull()
    expect(editor().setContents[0]).toContain('This is Folio')

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