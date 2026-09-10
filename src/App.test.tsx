import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import App from './App'
import { Accordion } from './components/Accordion'
import styles from './components/JournalCalendar.module.css'
import { FakeFileHandle, buildTree, type FakeDirectoryHandle } from './vault/fakeHandle'
import { FileSystemVaultStorage } from './vault/fs'
import { dayLabel } from './components/months'
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

// The completion pool must be rebuilt when the index changes and never per
// keystroke or page switch (add-reference-autocomplete, design D2/D8). Counting
// candidateNames calls is the direct evidence, so the real implementation is
// wrapped rather than replaced.
const candidateCalls = vi.hoisted(() => ({ count: 0 }))
vi.mock('./vault/suggest', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./vault/suggest')>()
  return {
    ...actual,
    candidateNames: (...args: Parameters<typeof actual.candidateNames>) => {
      candidateCalls.count += 1
      return actual.candidateNames(...args)
    },
  }
})

type FakeView = EditorAdapter & {
  setContents: string[]
  insertions: string[]
  emitChange: (markdown: string) => void
  emitReferenceClick: (target: string) => void
  suggest: (query: string) => import('./vault/suggest').Suggestion[]
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
  // The folder opens onto today's journal (journal-home). Wait for that
  // auto-open to land before handing control back: a click that arrives inside
  // its window is overwritten by the pending effect, and the test then inspects
  // the journal's editor instead of the page it just opened.
  await waitFor(() => expect(editor()).toBeTruthy())
  return tree
}

describe('application shell', () => {
  it('renders the shell chrome with the open-a-folder empty state', async () => {
    render(<App />)
    expect(within(screen.getByRole('banner')).getByText('Folio')).toBeTruthy()
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
    // No vault: no journal calendar (ui-shell journal-calendar requirement).
    expect(screen.queryByRole('button', { name: 'Today' })).toBeNull()
  })

  it('keeps the keyboard-shortcuts reference in the right panel, with no dialog', async () => {
    const { container } = render(<App />)
    // The shell holds no help affordance and no modal surface anywhere.
    expect(container.querySelector('button[aria-label="Keyboard shortcuts"]')).toBeNull()
    expect(screen.queryByRole('dialog')).toBeNull()
    // The reference is the panel's last section, collapsed until opened.
    const summary = await screen.findByText('Keyboard shortcuts')
    const section = summary.closest('details') as HTMLDetailsElement
    expect(section.open).toBe(false)
    fireEvent.click(summary)
    expect(section.open).toBe(true)
    expect(screen.getByText('Bold')).toBeTruthy()
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
    // Journal days appear as marked calendar cells, not rows.
    expect(screen.getByRole('button', { name: 'September 2, 2026' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'September 4, 2026' })).toBeTruthy()
    vi.unstubAllGlobals()
  })

  it("opens today's journal when a folder is opened", async () => {
    render(<App />)
    const tree = await openFixture()
    // The journal is the home (journal-home): opening a folder lands on
    // today's note — blank here, since the fixture has no file for today —
    // seeded from nothing, and merely opening creates no file (the
    // unmaterialized-pages rule).
    await waitFor(() => expect(editor().setContents[0]).toBe(''))
    expect(within(pane()).queryByText('Your notes appear here.')).toBeNull()
    const today = new Date()
    const cell = screen.getByRole('button', {
      name: dayLabel(today),
    })
    expect(cell.getAttribute('aria-current')).toBe('date')
    const journalsDir = tree.children.get('journals') as FakeDirectoryHandle
    expect(journalsDir.children.size).toBe(3) // 2026-09-02..04 only
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
    await waitFor(() => expect(editor().setContents[0]).toContain('Open a note from the sidebar'))
    expect(row.getAttribute('aria-current')).toBe('page')
    vi.unstubAllGlobals()
  })

  it('clicking a journal entry opens it like a page', async () => {
    render(<App />)
    await openFixture()
    fireEvent.click(await screen.findByRole('button', { name: 'September 3, 2026' }))
    expect(within(pane()).queryByRole('heading', { level: 1 })).toBeNull()
    await waitFor(() =>
      expect(editor().setContents[0]).toContain('Sketching how backlinks should behave'),
    )
    vi.unstubAllGlobals()
  })

  it('typing into the auto-opened today note materializes it on save', async () => {
    render(<App />)
    const tree = await openFixture()
    await waitFor(() => expect(editor().setContents[0]).toBe(''))
    const journalsDir = tree.children.get('journals') as FakeDirectoryHandle
    const today = new Date()
    const date = `${today.getFullYear()}-${`${today.getMonth() + 1}`.padStart(2, '0')}-${`${today.getDate()}`.padStart(2, '0')}`
    expect(journalsDir.children.get(`${date}.md`)).toBeUndefined()
    // The blank today page reads as a brand-new page; the first save
    // materializes journals/<today>.md (journal-home unmaterialized rule).
    editor().emitChange('Started the day in the journal.')
    const status = await screen.findByRole('status')
    expect(status.textContent).toBe('New page: created on first save')
    await waitFor(() => expect(screen.queryByRole('status')).toBeNull(), { timeout: 3000 })
    const file = journalsDir.children.get(`${date}.md`) as FakeFileHandle
    expect(await (await file.getFile()).text()).toBe('Started the day in the journal.')
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
    expect(screen.getByRole('button', { name: 'Reading' }).getAttribute('aria-current')).toBe(
      'page',
    )
    expect(screen.getByRole('button', { name: 'Welcome' }).getAttribute('aria-current')).toBeNull()
    vi.unstubAllGlobals()
  })

  it("meta panel lists the open page's backlinks and forwardlinks", async () => {
    render(<App />)
    await openFixture()
    fireEvent.click(await screen.findByRole('button', { name: 'Folio' }))

    const meta = () => screen.getByRole('complementary', { name: 'Page sidebar' })
    // Folio is referenced by Inbox and Ideas; it references architecture
    // (dangling, dimmed), Ideas, and Welcome.
    await waitFor(() => expect(within(meta()).getByRole('button', { name: 'Inbox' })).toBeTruthy())
    // Ideas appears in both Folio's backlinks and forwardlinks, so expect at
    // least one row.
    expect(within(meta()).getAllByRole('button', { name: 'Ideas' }).length).toBeGreaterThan(0)
    // Forwardlinks: real target Welcome + dangling architecture (dimmed).
    expect(within(meta()).getByRole('button', { name: 'Welcome' })).toBeTruthy()
    const dimmed = within(meta()).getByRole('button', { name: 'architecture' })
    expect(dimmed.className).toContain('dimmed')
    vi.unstubAllGlobals()
  })

  it('keeps placeholder copy while no page is open', async () => {
    render(<App />)
    await openFixture()
    // Wait for the vault to be fully open and indexed before returning home:
    // the open flow is async, and a home click that races it re-triggers
    // indexing (skeletons), not the settled state this test targets.
    await screen.findByRole('button', { name: 'Welcome' })
    // Return home (brand): no active folder, no page open, and not indexing —
    // the meta panel falls back to its placeholder copy (indexing-loading-
    // state only swaps in skeleton rows while a folder's index builds).
    fireEvent.click(screen.getByRole('button', { name: 'Folio, go home' }))
    expect(
      await screen.findByText('Pages linking to this one appear once a page is open.'),
    ).toBeTruthy()
    expect(screen.getByText('Links from this page appear once a page is open.')).toBeTruthy()
    vi.unstubAllGlobals()
  })

  it('seeds the editor with the open page content (reference tokens intact)', async () => {
    render(<App />)
    await openFixture()
    fireEvent.click(await screen.findByRole('button', { name: 'Welcome' }))
    const fake = editor()
    // The editor is seeded with the page's Markdown; reference tokens stay
    // literal text in the document (the badge is a decoration, not a node).
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
    // The re-armed edit shows as dirty before it saves. Observing that status
    // first is what makes the wait below wait: on its own, "no status" is also
    // true before React has rendered the edit, so it could pass on a clean pane
    // and the file assertion would then read the pre-edit content.
    const retry = await screen.findByRole('status')
    expect(retry.textContent).toBe('Unsaved changes')
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

    await waitFor(() => expect(editor().insertions).toContain('![photo](assets/photo.png)'))
    const assetsDir = tree.children.get('assets') as FakeDirectoryHandle
    expect(assetsDir).toBeTruthy()
    const file = assetsDir.children.get('photo.png') as FakeFileHandle
    expect(await (await file.getFile()).text()).toBe('imgbytes')
    vi.unstubAllGlobals()
  })
})

describe('links pane navigation (static-navigation + ui-shell spec)', () => {
  const meta = () => screen.getByRole('complementary', { name: 'Page sidebar' })

  it('clicking a backlink row opens the referring page', async () => {
    render(<App />)
    await openFixture()
    fireEvent.click(await screen.findByRole('button', { name: 'Folio' }))
    // Folio's backlinks: Inbox and Ideas. Click Ideas to navigate there.
    fireEvent.click(within(meta()).getAllByRole('button', { name: 'Ideas' })[0])
    await waitFor(() =>
      expect(editor().setContents[0]).toContain('Half-formed thoughts worth keeping'),
    )
    expect(screen.getByRole('button', { name: 'Ideas' }).getAttribute('aria-current')).toBe('page')
    vi.unstubAllGlobals()
  })

  it('a dangling forwardlink opens blank and materializes on first save', async () => {
    render(<App />)
    const tree = await openFixture()
    fireEvent.click(await screen.findByRole('button', { name: 'Folio' }))
    // Folio references #architecture (no such file). Clicking the dimmed row
    // opens it as a blank in-memory page; no file is created yet.
    fireEvent.click(await within(meta()).findByRole('button', { name: 'architecture' }))
    expect(tree.children.get('architecture.md')).toBeUndefined()
    await waitFor(() => expect(editor().setContents[0]).toBe(''))

    // First edit reads as a brand-new page, not an edit to an existing file.
    editor().emitChange('Notes on how the shell fits together')
    const status = await screen.findByRole('status')
    expect(status.textContent).toBe('New page: created on first save')

    // The save materializes the file on disk and clears the indicator.
    await waitFor(() => expect(screen.queryByRole('status')).toBeNull(), { timeout: 3000 })
    const file = tree.children.get('architecture.md') as FakeFileHandle
    expect(await (await file.getFile()).text()).toBe('Notes on how the shell fits together')
    vi.unstubAllGlobals()
  })
})

describe('journal calendar (static-navigation + ui-shell spec)', () => {
  it('clicking a day without a file opens blank and materializes on first save', async () => {
    render(<App />)
    const tree = await openFixture()
    const journalsDir = tree.children.get('journals') as FakeDirectoryHandle
    // Step into the fixture's month (September 2026) via a marked day.
    fireEvent.click(await screen.findByRole('button', { name: 'September 3, 2026' }))
    await waitFor(() =>
      expect(editor().setContents[0]).toContain('Sketching how backlinks should behave'),
    )

    // An unmarked day in the same month: clicking it opens a blank page and
    // creates no file (no orphan days for days merely visited).
    fireEvent.click(screen.getByRole('button', { name: 'September 18, 2026' }))
    expect(journalsDir.children.get('2026-09-18.md')).toBeUndefined()
    await waitFor(() => expect(editor().setContents[0]).toBe(''))

    // Writing into the day reads as a brand-new page, then materializes it.
    editor().emitChange('Wrote a journal entry')
    const status = await screen.findByRole('status')
    expect(status.textContent).toBe('New page: created on first save')
    await waitFor(() => expect(screen.queryByRole('status')).toBeNull(), { timeout: 3000 })
    const file = journalsDir.children.get('2026-09-18.md') as FakeFileHandle
    expect(await (await file.getFile()).text()).toBe('Wrote a journal entry')

    // Once the day exists it is marked in the calendar.
    const day = screen.getByRole('button', { name: 'September 18, 2026' })
    await waitFor(() => expect(day.classList.contains(styles.marked)).toBe(true))
    vi.unstubAllGlobals()
  })
})

describe('reference completion', () => {
  it('feeds the editor from the live index, rebuilding on save only', async () => {
    render(<App />)
    await openFixture()
    // The app's pool reaches the editor through the seam.
    await waitFor(() =>
      expect(
        editor()
          .suggest('Read')
          .map((row) => row.name),
      ).toContain('Reading'),
    )

    // A keystroke and a page switch only touch drafts and routing: no rebuild.
    const afterOpen = candidateCalls.count
    editor().emitChange('Edited the today note')
    fireEvent.click(await screen.findByRole('button', { name: 'Welcome' }))
    expect(candidateCalls.count).toBe(afterOpen)

    // The debounced save lands, the index is replaced, and the pool is rebuilt.
    await waitFor(() => expect(candidateCalls.count).toBeGreaterThan(afterOpen), {
      timeout: 3000,
    })
    vi.unstubAllGlobals()
  })
})

describe('folder rail flow', () => {
  it('shows the Add folder button before any folder opens', async () => {
    render(<App />)
    expect(await screen.findByRole('button', { name: 'Add folder' })).toBeTruthy()
  })

  it("switching folders resets to the new folder's journal; re-clicking the active folder keeps the page", async () => {
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

    // Switching to a different folder resets the open page to the new
    // folder's today journal (journal-home) — blank here, since Home has no
    // journals directory.
    fireEvent.click(await screen.findByRole('button', { name: 'Open folder Home' }))
    await waitFor(() => expect(editor().setContents[0]).toBe(''))
    expect(within(pane()).queryByText('Your notes appear here.')).toBeNull()
    expect(within(pane()).queryByRole('heading', { level: 1, name: 'Welcome' })).toBeNull()
    vi.unstubAllGlobals()
  })
})
describe('content search over the real index (search spec)', () => {
  it('is disabled before a vault folder opens', () => {
    render(<App />)
    expect((screen.getByLabelText('Search notes') as HTMLInputElement).disabled).toBe(true)
  })

  it('opens a page from a search result', async () => {
    render(<App />)
    await openFixture()
    await screen.findByRole('button', { name: 'Welcome' }) // index built: search is enabled
    const search = screen.getByLabelText('Search notes') as HTMLInputElement
    fireEvent.change(search, { target: { value: 'backlinks' } })
    // 'backlinks' matches Ideas.md (page) and journals/2026-09-03.md (journal).
    await waitFor(() => expect(screen.getAllByRole('option').length).toBe(2))
    fireEvent.click(screen.getByRole('option', { name: /^Ideas/ }))
    await waitFor(() =>
      expect(editor().setContents[0]).toContain('Half-formed thoughts worth keeping'),
    )
    vi.unstubAllGlobals()
  })

  it('opens a journal day from a search result like the calendar would', async () => {
    render(<App />)
    await openFixture()
    await screen.findByRole('button', { name: 'Welcome' }) // index built: search is enabled
    const search = screen.getByLabelText('Search notes') as HTMLInputElement
    fireEvent.change(search, { target: { value: 'fresh vault' } })
    // Only journals/2026-09-02.md holds the phrase; the result is labelled
    // with the pretty date and opens the day through the shared selection path.
    const day = await screen.findByRole('option', { name: /September 2, 2026/ })
    fireEvent.click(day)
    await waitFor(() => expect(editor().setContents[0]).toContain('Started a fresh vault'))
    vi.unstubAllGlobals()
  })

  it('switching folders clears the query and closes the dropdown', async () => {
    render(<App />)
    await openFixture()
    await screen.findByRole('button', { name: 'Welcome' }) // index built: search is enabled
    const search = screen.getByLabelText('Search notes') as HTMLInputElement
    fireEvent.change(search, { target: { value: 'backlinks' } })
    await waitFor(() => expect(screen.getAllByRole('option').length).toBeGreaterThan(0))

    const home = buildTree({ 'b.md': 'b' })
    home.name = 'Home'
    vi.stubGlobal(
      'showDirectoryPicker',
      vi.fn(async () => home as unknown as FileSystemDirectoryHandle),
    )
    fireEvent.click(await screen.findByRole('button', { name: 'Add folder' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Open folder Home' }))
    // The remounted input (folder-keyed) starts with an empty query.
    expect((screen.getByLabelText('Search notes') as HTMLInputElement).value).toBe('')
    expect(screen.queryByRole('listbox')).toBeNull()
    vi.unstubAllGlobals()
  })
})

describe('search results view (search-results-view spec)', () => {
  const search = () => screen.getByLabelText('Search notes') as HTMLInputElement
  const seeAll = () => screen.getByRole('button', { name: 'See all 4 results' })
  // The fixture: 'folio' matches Welcome, Inbox, Ideas, Folio (4 pages, no
  // journal day); 'backlinks' matches Ideas + journals/2026-09-03.md.

  it('opens the full results view from the see-all row', async () => {
    render(<App />)
    await openFixture()
    await screen.findByRole('button', { name: 'Welcome' }) // index built: search enabled
    fireEvent.change(search(), { target: { value: 'folio' } })
    await waitFor(() => expect(seeAll()).toBeTruthy())
    fireEvent.click(seeAll())
    // The main pane hosts the results view: query summary, count, no pager.
    expect(within(pane()).getByText('4 matches')).toBeTruthy()
    expect(within(pane()).getByRole('button', { name: /^Welcome/ })).toBeTruthy()
    expect(within(pane()).getByRole('button', { name: /^Inbox/ })).toBeTruthy()
    expect(within(pane()).getByRole('button', { name: /^Folio/ })).toBeTruthy()
    expect(within(pane()).queryByRole('button', { name: /Next/ })).toBeNull()
    vi.unstubAllGlobals()
  })

  it('opens a result from the results view into the editor', async () => {
    render(<App />)
    await openFixture()
    await screen.findByRole('button', { name: 'Welcome' })
    fireEvent.change(search(), { target: { value: 'folio' } })
    await waitFor(() => expect(seeAll()).toBeTruthy())
    fireEvent.click(seeAll())
    fireEvent.click(within(pane()).getByRole('button', { name: /^Inbox/ }))
    await waitFor(() => expect(editor().setContents[0]).toContain('A place to drop thoughts'))
    // The results view is gone; only the editor content remains.
    expect(within(pane()).queryByText('4 matches')).toBeNull()
    vi.unstubAllGlobals()
  })

  it('the meta panel is empty while the results view is open', async () => {
    render(<App />)
    await openFixture()
    fireEvent.click(await screen.findByRole('button', { name: 'Welcome' }))
    fireEvent.change(search(), { target: { value: 'folio' } })
    await waitFor(() => expect(seeAll()).toBeTruthy())
    fireEvent.click(seeAll())
    // Page metadata is page-scoped: empty placeholders while browsing.
    expect(screen.getByText('Pages linking to this one appear once a page is open.')).toBeTruthy()
    vi.unstubAllGlobals()
  })

  it('returns to results via the dropdown after opening a result', async () => {
    render(<App />)
    await openFixture()
    await screen.findByRole('button', { name: 'Welcome' })
    fireEvent.change(search(), { target: { value: 'folio' } })
    await waitFor(() => expect(seeAll()).toBeTruthy())
    fireEvent.click(seeAll())
    fireEvent.click(within(pane()).getByRole('button', { name: /^Folio/ }))
    await waitFor(() => expect(editor().setContents[0]).toContain('Notes on building Folio itself'))
    // Refocusing the search (query kept) restores the dropdown, and its
    // see-all row returns to the results view.
    fireEvent.focus(search())
    const row = await screen.findByRole('button', { name: 'See all 4 results' })
    fireEvent.click(row)
    expect(within(pane()).getByText('4 matches')).toBeTruthy()
    vi.unstubAllGlobals()
  })

  it('editing the query while the results view is open re-runs it', async () => {
    render(<App />)
    await openFixture()
    await screen.findByRole('button', { name: 'Welcome' })
    fireEvent.change(search(), { target: { value: 'folio' } })
    await waitFor(() => expect(seeAll()).toBeTruthy())
    fireEvent.click(seeAll())
    fireEvent.change(search(), { target: { value: 'backlinks' } })
    // Ideas (page) and journals/2026-09-03.md (journal) both re-run live.
    await waitFor(() => expect(within(pane()).getByText('2 matches')).toBeTruthy())
    expect(within(pane()).getByRole('button', { name: /September 3, 2026/ })).toBeTruthy()
    vi.unstubAllGlobals()
  })

  it('a query with no matches closes the results view', async () => {
    render(<App />)
    await openFixture()
    await screen.findByRole('button', { name: 'Welcome' })
    fireEvent.change(search(), { target: { value: 'folio' } })
    await waitFor(() => expect(seeAll()).toBeTruthy())
    fireEvent.click(seeAll())
    const previous = editor()
    fireEvent.change(search(), { target: { value: 'xyzzy' } })
    // No matches: the results view closes and the previously open page — the
    // auto-opened blank today journal (journal-home) — shows again; the
    // dropdown shows its empty state for the query.
    await waitFor(() => expect(editor()).not.toBe(previous))
    expect(editor().setContents[0]).toBe('')
    expect(within(pane()).queryByText('Your notes appear here.')).toBeNull()
    expect(screen.getByText('No matches for \u201Cxyzzy\u201D.')).toBeTruthy()
    vi.unstubAllGlobals()
  })

  it('browsing the results view writes nothing to the vault', async () => {
    render(<App />)
    const tree = await openFixture()
    await screen.findByRole('button', { name: 'Welcome' })
    fireEvent.change(search(), { target: { value: 'folio' } })
    await waitFor(() => expect(seeAll()).toBeTruthy())
    fireEvent.click(seeAll())
    const before = [...tree.children.keys()].sort()
    const previous = editor()
    fireEvent.keyDown(pane(), { key: 'Escape' })
    // Escape closes back to the previously open page (the blank today
    // journal), and browsing alone writes nothing to the vault.
    await waitFor(() => expect(editor()).not.toBe(previous))
    expect(editor().setContents[0]).toBe('')
    expect([...tree.children.keys()].sort()).toEqual(before)
    vi.unstubAllGlobals()
  })
})

describe('pinned pages (add-pinned-pages)', () => {
  // The five fixture page rows in the Pages section, in DOM order (scoped to
  // the sidebar — the header brand is also a button named 'Folio').
  const pageRowTitles = () =>
    within(screen.getByRole('complementary', { name: 'Notes' }))
      .getAllByRole('button')
      .map((b) => (b.textContent ?? '').trim())
      .filter((t) => ['Welcome', 'Inbox', 'Ideas', 'Folio', 'Reading'].includes(t))

  it('pins the open page from the status bar (pages only), persists, and unpins', async () => {
    render(<App />)
    const tree = await openFixture()
    const storage = new FileSystemVaultStorage(tree as unknown as FileSystemDirectoryHandle)
    await screen.findByRole('button', { name: 'Welcome' })

    // The landing is today's journal (a journal day): the toggle is disabled.
    const journalPin = screen.getByRole('button', { name: /^Pin / }) as HTMLButtonElement
    expect(journalPin.disabled).toBe(true)

    // Open a real page: the status-bar toggle enables.
    fireEvent.click(screen.getByRole('button', { name: 'Welcome' }))
    const star = (await screen.findByRole('button', { name: 'Pin Welcome' })) as HTMLButtonElement
    expect(star.disabled).toBe(false)

    // Pin it: the row gains the pinned style and leads the list.
    fireEvent.click(star)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Unpin Welcome' })).toBeTruthy())
    expect(pageRowTitles()).toEqual(['Welcome', 'Reading', 'Folio', 'Ideas', 'Inbox'])
    const welcomeRow = screen.getByRole('button', { name: 'Welcome' })
    expect(welcomeRow.getAttribute('data-pinned')).toBe('true')
    expect(welcomeRow.querySelector('svg')).toBeNull() // no icon on the row
    // The pin persists in the vault meta file, not the app.
    expect(await storage.read('.folio/pins.md')).toContain('- Welcome.md')

    // A journal day disables the toggle again.
    fireEvent.click(screen.getByRole('button', { name: 'September 2, 2026' }))
    await waitFor(() =>
      expect((screen.getByRole('button', { name: /^Pin / }) as HTMLButtonElement).disabled).toBe(
        true,
      ),
    )

    // Back on Welcome (sidebar row — the meta panel also carries a Welcome
    // forwardlink row while the journal is open), unpinning restores edit
    // order and clears the marker.
    fireEvent.click(
      within(screen.getByRole('complementary', { name: 'Notes' })).getByRole('button', {
        name: 'Welcome',
      }),
    )
    const unpin = await screen.findByRole('button', { name: 'Unpin Welcome' })
    fireEvent.click(unpin)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Pin Welcome' })).toBeTruthy())
    expect(pageRowTitles()).toEqual(['Reading', 'Folio', 'Ideas', 'Inbox', 'Welcome'])
    const welcomeRow2 = screen.getByRole('button', { name: 'Welcome' })
    expect(welcomeRow2.getAttribute('data-pinned')).toBeNull()
    expect(welcomeRow2.className).not.toContain('rowPinned')
    vi.unstubAllGlobals()
  })
})

describe('reference badges (add-reference-badges)', () => {
  it('clicking a reference badge opens its target page', async () => {
    render(<App />)
    await openFixture()
    fireEvent.click(await screen.findByRole('button', { name: 'Welcome' }))
    await waitFor(() => expect(editor().setContents[0]).toContain('#Inbox'))

    // Welcome references #Inbox, an existing page: activating the badge
    // resolves the name and opens Inbox.
    editor().emitReferenceClick('Inbox')
    await waitFor(() => expect(editor().setContents[0]).toContain('A place to drop thoughts'))
    expect(screen.getByRole('button', { name: 'Inbox' }).getAttribute('aria-current')).toBe('page')
    vi.unstubAllGlobals()
  })

  it('clicking a reference to a missing page opens a blank page', async () => {
    render(<App />)
    const tree = await openFixture()
    fireEvent.click(await screen.findByRole('button', { name: 'Welcome' }))
    await waitFor(() => expect(editor().setContents[0]).toContain('#notes'))

    // #notes has no file: the badge opens a blank page and creates nothing
    // until the first save (the Forwardlinks rule).
    editor().emitReferenceClick('notes')
    await waitFor(() => expect(editor().setContents[0]).toBe(''))
    expect(tree.children.get('notes.md')).toBeUndefined()
    vi.unstubAllGlobals()
  })

  it('a self-reference does not navigate', async () => {
    render(<App />)
    await openFixture()
    fireEvent.click(await screen.findByRole('button', { name: 'Welcome' }))
    await waitFor(() => expect(editor().setContents[0]).toContain('This is Folio'))

    const before = editor().setContents.length
    editor().emitReferenceClick('Welcome')
    // Still on Welcome: no remount, no new editor instance.
    expect(screen.getByRole('button', { name: 'Welcome' }).getAttribute('aria-current')).toBe(
      'page',
    )
    expect(editor().setContents).toHaveLength(before)
    vi.unstubAllGlobals()
  })
})
