import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import App from './App'
import { Accordion } from './components/Accordion'
import styles from './components/JournalCalendar.module.css'
import { FakeFileHandle, buildTree, type FakeDirectoryHandle } from './vault/fakeHandle'
import { FileSystemVaultStorage } from './vault/fs'
import { dayLabel } from './components/months'
import { localDayString } from './vault/index'
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

// The board editor is lazily imported and mounts Excalidraw; App tests stub it
// (add-whiteboards). The stub records the scene it was handed and exposes a way
// to emit a change, so the pane switch and the save wiring are observable
// without the real canvas.
const boardInstances = vi.hoisted(() => ({
  list: [] as { scene: string; onChange: (scene: string) => void }[],
}))
vi.mock('./editor/boardView', () => ({
  BoardView: ({
    initialScene,
    onChange,
  }: {
    initialScene: string
    onChange: (s: string) => void
  }) => {
    boardInstances.list.push({ scene: initialScene, onChange })
    return <div data-testid="board-view" data-scene={initialScene} />
  },
}))

// The completion pool must be rebuilt when the index changes and never per
// keystroke or page switch (add-reference-autocomplete, design D2/D8). Counting
// candidateNames calls is the direct evidence, so the real implementation is
// wrapped rather than replaced.
const candidateCalls = vi.hoisted(() => ({ count: 0 }))
const fileCandidateCalls = vi.hoisted(() => ({ count: 0 }))
vi.mock('./vault/suggest', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./vault/suggest')>()
  return {
    ...actual,
    candidateNames: (...args: Parameters<typeof actual.candidateNames>) => {
      candidateCalls.count += 1
      return actual.candidateNames(...args)
    },
    // The destination pool carries the same budget (add-asset-references,
    // design D4): built when the graph changes, never per keystroke.
    fileCandidates: (...args: Parameters<typeof actual.fileCandidates>) => {
      fileCandidateCalls.count += 1
      return actual.fileCandidates(...args)
    },
  }
})

// The keyboard-shortcuts reference is static content wrapped in memo: it must
// re-render only when a surface's availability changes, never on an ordinary
// edit (AGENTS.md: the keystroke budget). displayKeys runs once per rendered key
// chip, so counting its calls is the direct evidence that the list re-rendered,
// exactly as candidateNames is for the completion pool.
const displayKeyCalls = vi.hoisted(() => ({ count: 0 }))
vi.mock('./components/shortcuts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./components/shortcuts')>()
  return {
    ...actual,
    displayKeys: (raw: string) => {
      displayKeyCalls.count += 1
      return actual.displayKeys(raw)
    },
  }
})

// The sidebar is memoized so a keystroke in the open page does not re-create a
// row per page in the vault (add-page-history, design D8). The calendar inside
// it is the render proxy: dayLabel runs once per rendered day cell, so counting
// its calls shows whether the sidebar re-rendered at all.
const dayLabelCalls = vi.hoisted(() => ({ count: 0 }))
vi.mock('./components/months', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./components/months')>()
  return {
    ...actual,
    dayLabel: (date: Date) => {
      dayLabelCalls.count += 1
      return actual.dayLabel(date)
    },
  }
})

type FakeView = EditorAdapter & {
  content: string
  setContents: string[]
  insertions: string[]
  chords: string[]
  emitChange: (markdown: string) => void
  emitReferenceClick: (target: string, kind?: 'page' | 'board') => void
  suggest: (query: string) => import('./vault/suggest').Suggestion[]
  suggestFiles: (query: string, onlyImages: boolean) => import('./vault/suggest').Suggestion[]
}

// The most recently mounted editor instance.
const editor = () => editorInstances.list[editorInstances.list.length - 1] as FakeView

const pane = () => screen.getByRole('main')

// Page rows live in the Pages section, and the header's brand is also a button
// named 'Folio', so a row query says which section it means. Sections are
// `details` elements whose summary carries the title.
const section = (title: string) =>
  within((screen.getByText(title) as HTMLElement).closest('details') as HTMLElement)
const pagesSection = () => section('Pages')

/** The fixture vault's pages directory: pages live under `pages/`. */
const pagesDir = (tree: FakeDirectoryHandle) => tree.children.get('pages') as FakeDirectoryHandle

// Test fixture: the former mock-vault content lifted into real .md files
// (the promised scan/index fixture). 5 pages + 3 journals = 8 files.
const PAGES = {
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
}

const FIXTURE = {
  pages: PAGES,
  journals: {
    '2026-09-02.md': 'Started a fresh vault. First note: #Welcome.',
    '2026-09-03.md': 'Sketching how backlinks should behave. Added to #Ideas.',
    '2026-09-04.md': 'Built the shell. Next: make it navigable. Noted #architecture.',
  },
}

async function openFixture(
  tree: FakeDirectoryHandle = buildTree(FIXTURE),
): Promise<FakeDirectoryHandle> {
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
    // The open-folder hint is the supported-browser case: stub the picker the
    // shell is gated on (warn-unsupported-browser).
    vi.stubGlobal('showDirectoryPicker', vi.fn())
    try {
      render(<App />)
      expect(within(screen.getByRole('banner')).getByText('Folio')).toBeTruthy()
      expect(screen.getByLabelText('Search notes')).toBeTruthy()
      expect(screen.getByText('Journal')).toBeTruthy()
      expect(screen.getByText('Pages')).toBeTruthy()
      expect(screen.getByText('Backlinks')).toBeTruthy()
      // Restore resolves async; once no folder is present the hint settles.
      expect(await screen.findByText('Open a folder to begin.')).toBeTruthy()
      expect(screen.getByRole('button', { name: 'Add folder' })).toBeTruthy()
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('states the browser requirement and offers no add control without a picker', async () => {
    // No stub: jsdom has no `showDirectoryPicker`, which is the Firefox and
    // Safari case (warn-unsupported-browser).
    expect('showDirectoryPicker' in window).toBe(false)
    render(<App />)
    expect(
      await screen.findByText(
        'Folio needs a Chromium-based browser to open a local folder. Use Chrome, Edge, or Brave.',
      ),
    ).toBeTruthy()
    // No control promises the action the browser cannot perform, and the
    // instruction it replaces is gone.
    expect(screen.queryByRole('button', { name: 'Add folder' })).toBeNull()
    expect(screen.queryByText('Open a folder to begin.')).toBeNull()
    // The rail keeps its column so the shell's panes stay aligned.
    expect(screen.getByRole('navigation', { name: 'Open folders' })).toBeTruthy()
  })

  it('shows empty sidebar sections before a folder is opened', () => {
    render(<App />)
    expect(screen.queryByRole('button', { name: 'Welcome' })).toBeNull()
    // No vault: no journal calendar (ui-shell journal-calendar requirement).
    expect(screen.queryByRole('button', { name: 'Next month' })).toBeNull()
    // Today rides in the navigation row in every state, unusable without a
    // vault (move-today-into-nav-controls).
    expect((screen.getByRole('button', { name: 'Today' }) as HTMLButtonElement).disabled).toBe(true)
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
    expect(
      pagesSection().getByRole('button', { name: 'Reading' }).getAttribute('aria-current'),
    ).toBe('page')
    // Only the open page is marked: the other row keeps its plain state.
    expect(
      pagesSection().getByRole('button', { name: 'Welcome' }).getAttribute('aria-current'),
    ).toBeNull()
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

  it("references list the open page's files and open them without leaving the page", async () => {
    const tree = buildTree({
      pages: { 'Report.md': 'Started the report: [Q3 report](assets/q3-report.pdf).' },
      journals: { '2026-09-02.md': 'start' },
      assets: { 'q3-report.pdf': 'pdf bytes' },
    })
    // The open gesture hands the bytes to a new window (ADR-0021); stubbed so
    // the test can see the window was filled without a browser to open one.
    const tab = { opener: null, location: { href: '' }, close: vi.fn() }
    const opened = vi.fn(() => tab)
    vi.stubGlobal('open', opened)

    render(<App />)
    await openFixture(tree)
    fireEvent.click(await screen.findByRole('button', { name: 'Report' }))

    // The file is listed in its own section, named for the file, and is not
    // dimmed: an asset row exists only for a file the vault holds.
    const row = await section('References').findByRole('button', { name: 'q3-report.pdf' })
    expect(row.className).not.toContain('dimmed')
    expect(row.getAttribute('aria-current')).toBeNull()
    // Forwardlinks holds page rows only, so the same page's file is not there.
    expect(section('Forwardlinks').queryByRole('button')).toBeNull()

    fireEvent.click(row)
    await waitFor(() => expect(opened).toHaveBeenCalledTimes(1))
    expect(tab.location.href).toMatch(/^blob:/)
    // Opening a file is not navigation: the same page is still open.
    expect(editor().setContents[0]).toContain('Started the report')
    vi.unstubAllGlobals()
  })

  it("lists the vault's files in the sidebar and opens one from there", async () => {
    const tree = buildTree({
      pages: { 'Report.md': 'no references here' },
      journals: { '2026-09-02.md': 'start' },
      assets: { 'q3-report.pdf': 'pdf bytes', 'shot.png': 'png bytes' },
    })
    const tab = { opener: null, location: { href: '' }, close: vi.fn() }
    const opened = vi.fn(() => tab)
    vi.stubGlobal('open', opened)

    render(<App />)
    await openFixture(tree)

    // Path-ordered, labelled by the path inside assets/.
    const rows = section('Assets')
      .getAllByRole('button')
      .map((b) => b.textContent)
    expect(rows).toEqual(['q3-report.pdf', 'shot.png'])

    // Rows are in the document even while the section is collapsed, so a file
    // is reachable without opening it first (the summary is always rendered).
    expect(
      (screen.getByText('Assets').closest('details') as HTMLElement).hasAttribute('open'),
    ).toBe(false)

    fireEvent.click(section('Assets').getByRole('button', { name: 'shot.png' }))
    await waitFor(() => expect(opened).toHaveBeenCalledTimes(1))
    expect(tab.location.href).toMatch(/^blob:/)
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
    const file = pagesDir(tree).children.get('Welcome.md') as FakeFileHandle
    expect(await (await file.getFile()).text()).toBe('edited welcome body')
    vi.unstubAllGlobals()
  })

  it('leaving a page before the save keeps the draft and restores it on return', async () => {
    render(<App />)
    await openFixture()
    fireEvent.click(await screen.findByRole('button', { name: 'Welcome' }))
    editor().emitChange('draft of welcome')
    fireEvent.click(await screen.findByRole('button', { name: 'Reading' }))
    // Welcome now sits in the trail too, so name the Pages row.
    fireEvent.click(pagesSection().getByRole('button', { name: 'Welcome' }))

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
    const file = pagesDir(tree).children.get('Welcome.md') as FakeFileHandle
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
      types: [],
      getData: () => '',
    }
    fireEvent.drop(pane(), { dataTransfer })

    await waitFor(() => expect(editor().insertions).toContain('![photo](assets/photo.png)'))
    const assetsDir = tree.children.get('assets') as FakeDirectoryHandle
    expect(assetsDir).toBeTruthy()
    const file = assetsDir.children.get('photo.png') as FakeFileHandle
    expect(await (await file.getFile()).text()).toBe('imgbytes')
    vi.unstubAllGlobals()
  })

  it('renders a vault image reference through the active folder storage', async () => {
    // render-vault-images: a page whose markdown references a vault image shows
    // the file, read out of the open vault through the app's wiring. The page is
    // today's journal, which the app opens by itself on folder open, so the test
    // needs no sidebar click and no page switch: one seed, one render pass.
    const readBinary = vi.spyOn(FileSystemVaultStorage.prototype, 'readBinary')
    const journal = localDayString(new Date())
    const tree = buildTree({
      ...FIXTURE,
      // buildTree nests by object, so the journal file goes inside the folder
      // it lives in and the asset inside assets/.
      journals: { ...FIXTURE.journals, [`${journal}.md`]: '![photo](assets/photo.png)' },
      assets: { 'photo.png': 'imgbytes' },
    })
    tree.name = 'notes'
    vi.stubGlobal(
      'showDirectoryPicker',
      vi.fn(async () => tree as unknown as FileSystemDirectoryHandle),
    )
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'Add folder' }))

    // The editor renders the reference as an image element and the pane points
    // it at the vault file's bytes.
    const img = await waitFor(() => {
      const el = document.querySelector('main img')
      expect(el).not.toBeNull()
      expect(el?.getAttribute('src')).toMatch(/^blob:/)
      return el as HTMLImageElement
    })
    expect(readBinary).toHaveBeenCalledWith('assets/photo.png')
    expect(img.getAttribute('alt')).toBe('photo')
    // The page's markdown is untouched: only the rendered element was re-pointed.
    expect(editor().content).toBe('![photo](assets/photo.png)')
    readBinary.mockRestore()
    vi.unstubAllGlobals()
  })

  it('pasting a bitmap attaches it and it renders from the vault', async () => {
    // attach-pasted-files: the paste gesture feeds the same intake as a drop,
    // and the result renders through the vault-image path.
    render(<App />)
    const tree = await openFixture()
    fireEvent.click(await screen.findByRole('button', { name: 'Welcome' }))
    await waitFor(() => expect(editor().content).toContain('This is Folio'))

    const bitmap = new File(['png'], 'image.png', { type: 'image/png' })
    await act(async () => {
      fireEvent.paste(pane(), {
        clipboardData: {
          files: [bitmap],
          items: [{ kind: 'file', getAsFile: () => bitmap }],
          getData: () => '',
        },
      })
    })

    // The asset landed under a timestamped name and the page links it.
    const insertion = editor().insertions.at(-1) ?? ''
    const linked = /^!\[(pasted-\d{8}-\d{6})\]\(assets\/(pasted-\d{8}-\d{6}\.png)\)$/.exec(
      insertion,
    )
    expect(linked).not.toBeNull()
    const assetsDir = tree.children.get('assets') as FakeDirectoryHandle
    expect(assetsDir.children.has(linked![2])).toBe(true)

    // And the reference renders the bytes that were just pasted.
    const img = await waitFor(
      () => {
        const el = document.querySelector('main img')
        expect(el?.getAttribute('src')).toMatch(/^blob:/)
        return el as HTMLImageElement
      },
      { timeout: 4000 },
    )
    expect(img.getAttribute('alt')).toBe(linked![1])
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
    expect(pagesDir(tree).children.get('architecture.md')).toBeUndefined()
    await waitFor(() => expect(editor().setContents[0]).toBe(''))

    // First edit reads as a brand-new page, not an edit to an existing file.
    editor().emitChange('Notes on how the shell fits together')
    const status = await screen.findByRole('status')
    expect(status.textContent).toBe('New page: created on first save')

    // The save materializes the file on disk and clears the indicator.
    await waitFor(() => expect(screen.queryByRole('status')).toBeNull(), { timeout: 3000 })
    const file = pagesDir(tree).children.get('architecture.md') as FakeFileHandle
    expect(await (await file.getFile()).text()).toBe('Notes on how the shell fits together')
    vi.unstubAllGlobals()
  })

  it('a forwardlink to a date opens the journal day', async () => {
    render(<App />)
    const tree = await openFixture()
    const journalsDir = tree.children.get('journals') as FakeDirectoryHandle
    // The auto-opened today journal gains a date reference; wait for the save
    // so the row derives from the index.
    editor().emitChange('See #[[2026-09-19]] for that day')
    await waitFor(
      () => expect(journalsDir.children.has(`${localDayString(new Date())}.md`)).toBe(true),
      { timeout: 3000 },
    )

    // No journal file for the day: the row is dimmed, and clicking it opens
    // the journal day without writing a file.
    const row = await within(meta()).findByRole(
      'button',
      { name: '2026-09-19' },
      {
        timeout: 3000,
      },
    )
    expect(row.className).toContain('dimmed')
    fireEvent.click(row)
    await waitFor(() => expect(editor().setContents[0]).toBe(''))
    expect(journalsDir.children.get('2026-09-19.md')).toBeUndefined()
    expect(screen.getByTitle('journals/2026-09-19.md').textContent).toBe('journals/2026-09-19.md')
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

  // The destination picker's pool follows the same budget (add-asset-references,
  // design D4): the vault's files, handed to the editor through the same seam,
  // rebuilt when the index changes and never per keystroke or page switch.
  it('feeds the destination picker from the vault, rebuilding on save only', async () => {
    render(<App />)
    await openFixture(buildTree({ ...FIXTURE, assets: { 'Q3 report.pdf': 'x' } }))
    await waitFor(() =>
      expect(
        editor()
          .suggestFiles('q3', false)
          .map((row) => row.path),
      ).toEqual(['assets/Q3 report.pdf']),
    )
    // An image's destination takes only images, so the PDF is not offered.
    expect(editor().suggestFiles('q3', true)).toEqual([])

    const afterOpen = fileCandidateCalls.count
    editor().emitChange('Edited the today note')
    fireEvent.click(await screen.findByRole('button', { name: 'Welcome' }))
    expect(fileCandidateCalls.count).toBe(afterOpen)

    await waitFor(() => expect(fileCandidateCalls.count).toBeGreaterThan(afterOpen), {
      timeout: 3000,
    })
    vi.unstubAllGlobals()
  })
})

describe('folder rail flow', () => {
  it('shows the Add folder button before any folder opens', async () => {
    // The control is gated on the picker: stub it for the supported case
    // (warn-unsupported-browser).
    vi.stubGlobal('showDirectoryPicker', vi.fn())
    try {
      render(<App />)
      expect(await screen.findByRole('button', { name: 'Add folder' })).toBeTruthy()
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it("switching folders resets to the new folder's journal; re-clicking the active folder keeps the page", async () => {
    render(<App />)
    await openFixture()
    fireEvent.click(await screen.findByRole('button', { name: 'Welcome' }))
    expect(within(pane()).queryByRole('heading', { level: 1 })).toBeNull()
    await waitFor(() => expect(editor().setContents[0]).toContain('This is Folio'))

    const home = buildTree({ pages: { 'b.md': 'b' } })
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

    const home = buildTree({ pages: { 'b.md': 'b' } })
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
    const before = [...pagesDir(tree).children.keys()].sort()
    const previous = editor()
    fireEvent.keyDown(pane(), { key: 'Escape' })
    // Escape closes back to the previously open page (the blank today
    // journal), and browsing alone writes nothing to the vault.
    await waitFor(() => expect(editor()).not.toBe(previous))
    expect(editor().setContents[0]).toBe('')
    expect([...pagesDir(tree).children.keys()].sort()).toEqual(before)
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
    expect(await storage.read('.folio/pins.md')).toContain('- pages/Welcome.md')

    // A journal day disables the toggle again.
    fireEvent.click(screen.getByRole('button', { name: 'September 2, 2026' }))
    await waitFor(() =>
      expect((screen.getByRole('button', { name: /^Pin / }) as HTMLButtonElement).disabled).toBe(
        true,
      ),
    )

    // Back on Welcome (the Pages row — the meta panel's forwardlinks also
    // carry a Welcome row), unpinning restores edit order and clears the marker.
    fireEvent.click(pagesSection().getByRole('button', { name: 'Welcome' }))
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
    expect(pagesDir(tree).children.get('notes.md')).toBeUndefined()
    vi.unstubAllGlobals()
  })

  it('clicking a reference to a date opens the journal day, not a page', async () => {
    render(<App />)
    const tree = await openFixture()
    const journalsDir = tree.children.get('journals') as FakeDirectoryHandle
    fireEvent.click(await screen.findByRole('button', { name: 'Welcome' }))
    await waitFor(() => expect(editor().setContents[0]).toContain('This is Folio'))

    // 2026-09-19 has no journal file: the badge opens the day, the breadcrumb
    // names the journal path, and nothing is written under pages/ or journals/.
    editor().emitReferenceClick('2026-09-19')
    await waitFor(() => expect(editor().setContents[0]).toBe(''))
    expect(screen.getByTitle('journals/2026-09-19.md').textContent).toBe('journals/2026-09-19.md')
    expect(journalsDir.children.get('2026-09-19.md')).toBeUndefined()
    expect(pagesDir(tree).children.get('2026-09-19.md')).toBeUndefined()
    // The calendar anchors to the day that opened.
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'September 19, 2026' }).getAttribute('aria-current'),
      ).toBe('date'),
    )
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

// Applying a key combination from the reference (apply-shortcuts-on-click):
// the shell routes an editor row to the editor and an app row to the document,
// disables rows whose surface is unavailable, and keeps the one non-keydown row
// a plain label.
describe('applying shortcuts from the reference (apply-shortcuts-on-click)', () => {
  const openReference = async () => {
    const summary = await screen.findByText('Keyboard shortcuts')
    const section = summary.closest('details') as HTMLDetailsElement
    if (!section.open) fireEvent.click(summary)
    return section
  }
  const control = (name: string) => screen.getByRole('button', { name }) as HTMLButtonElement

  it('disables every row while no surface can accept it', async () => {
    render(<App />)
    await openReference()
    // No vault: no editor is mounted and search is disabled, so no row acts.
    for (const name of ['Bold Ctrl+B', 'Indent list item Tab', 'Search notes Ctrl+K']) {
      expect(control(name).disabled).toBe(true)
    }
    // The row whose chord is not a keydown binding is never a control.
    expect(screen.queryByRole('button', { name: /Paste as plain text/ })).toBeNull()
  })

  it('enables the editor rows once a page is open and sends the chord to the editor', async () => {
    render(<App />)
    await openFixture()
    await openReference()
    expect(control('Bold Ctrl+B').disabled).toBe(false)
    expect(control('Search notes Ctrl+K').disabled).toBe(false)
    fireEvent.click(control('Bold Ctrl+B'))
    expect(editor().chords).toEqual(['Mod-b'])
    vi.unstubAllGlobals()
  })

  it('routes the app row through the document, focusing the search box', async () => {
    render(<App />)
    await openFixture()
    await openReference()
    fireEvent.click(control('Search notes Ctrl+K'))
    // The chord reaches the app's own document listener, which focuses search.
    expect(document.activeElement).toBe(screen.getByLabelText('Search notes'))
    vi.unstubAllGlobals()
  })

  it('does not re-render the reference on an ordinary edit', async () => {
    render(<App />)
    await openFixture()
    await openReference()
    expect(displayKeyCalls.count).toBeGreaterThan(0)
    const before = displayKeyCalls.count

    // A keystroke reaches App as a draft change; the reference's props are
    // unchanged, so memo bails out and displayKeys is not called again.
    await act(async () => {
      editor().emitChange('a different body')
    })
    expect(editor().content).toBe('a different body')
    expect(displayKeyCalls.count).toBe(before)

    vi.unstubAllGlobals()
  })
})

describe('history navigation (add-history-navigation spec)', () => {
  const nav = () => screen.getByRole('complementary', { name: 'Notes' })
  const back = () => nav().querySelector<HTMLButtonElement>('button[aria-label="Back"]')!
  const forward = () => nav().querySelector<HTMLButtonElement>('button[aria-label="Forward"]')!
  // The page the sidebar marks as open.
  const openRow = () =>
    pagesSection()
      .getAllByRole('button')
      .find((b) => b.getAttribute('aria-current') === 'page')?.textContent

  it('offers nowhere to step at the start of a session', async () => {
    render(<App />)
    await openFixture()
    // The journal the app opened by itself is the trail's only entry.
    expect(back().disabled).toBe(true)
    expect(forward().disabled).toBe(true)
    vi.unstubAllGlobals()
  })

  it('steps back and forward through the pages opened, without adding entries', async () => {
    render(<App />)
    await openFixture()
    fireEvent.click(pagesSection().getByRole('button', { name: 'Welcome' }))
    fireEvent.click(pagesSection().getByRole('button', { name: 'Reading' }))
    await waitFor(() => expect(openRow()).toBe('Reading'))
    expect(back().disabled).toBe(false)
    expect(forward().disabled).toBe(true)

    fireEvent.click(back())
    await waitFor(() => expect(openRow()).toBe('Welcome'))
    expect(forward().disabled).toBe(false)

    fireEvent.click(forward())
    await waitFor(() => expect(openRow()).toBe('Reading'))

    // The step added no entry: stepping back again reaches Welcome (an
    // appended entry would have made Back land on Reading itself).
    fireEvent.click(back())
    await waitFor(() => expect(openRow()).toBe('Welcome'))
    expect(forward().disabled).toBe(false)
    vi.unstubAllGlobals()
  })

  it('discards what was ahead when a new page opens', async () => {
    render(<App />)
    await openFixture()
    fireEvent.click(pagesSection().getByRole('button', { name: 'Welcome' }))
    fireEvent.click(pagesSection().getByRole('button', { name: 'Reading' }))
    fireEvent.click(pagesSection().getByRole('button', { name: 'Folio' }))
    fireEvent.click(back()) // back to Reading
    await waitFor(() => expect(openRow()).toBe('Reading'))
    expect(forward().disabled).toBe(false)

    // A fresh navigation from a backed-out position starts a new line.
    fireEvent.click(pagesSection().getByRole('button', { name: 'Inbox' }))
    await waitFor(() => expect(openRow()).toBe('Inbox'))
    expect(forward().disabled).toBe(true)
    fireEvent.click(back())
    await waitFor(() => expect(openRow()).toBe('Reading'))
    fireEvent.click(forward())
    await waitFor(() => expect(openRow()).toBe('Inbox'))
    vi.unstubAllGlobals()
  })

  it('clears the trail when the folder changes', async () => {
    render(<App />)
    await openFixture()
    fireEvent.click(pagesSection().getByRole('button', { name: 'Welcome' }))
    fireEvent.click(pagesSection().getByRole('button', { name: 'Reading' }))
    await waitFor(() => expect(back().disabled).toBe(false))

    const home = buildTree({ pages: { 'b.md': 'b' } })
    home.name = 'Home'
    vi.stubGlobal(
      'showDirectoryPicker',
      vi.fn(async () => home as unknown as FileSystemDirectoryHandle),
    )
    fireEvent.click(await screen.findByRole('button', { name: 'Add folder' }))
    await screen.findByRole('button', { name: 'b' })
    fireEvent.click(await screen.findByRole('button', { name: 'Open folder Home' }))
    await waitFor(() => expect(editor().setContents[0]).toBe(''))

    // The new folder's own today journal is the trail, and nothing from the
    // previous vault can be reached any more.
    expect(back().disabled).toBe(true)
    expect(forward().disabled).toBe(true)
    vi.unstubAllGlobals()
  })

  it('records navigation without writing anything to the vault', async () => {
    render(<App />)
    const tree = await openFixture()
    const meta = () => screen.getByRole('complementary', { name: 'Page sidebar' })
    const before = [...pagesDir(tree).children.keys()].sort()
    const write = vi.spyOn(FileSystemVaultStorage.prototype, 'write')

    fireEvent.click(await screen.findByRole('button', { name: 'Folio' }))
    // Folio references #architecture, which has no file: opening it creates a
    // blank page, and mere recording must not materialize it.
    fireEvent.click(within(meta()).getByRole('button', { name: 'architecture' }))
    await waitFor(() => expect(editor().setContents[0]).toBe(''))
    await waitFor(() => expect(back().disabled).toBe(false))

    expect(write).not.toHaveBeenCalled()
    expect([...pagesDir(tree).children.keys()].sort()).toEqual(before)
    write.mockRestore()
    vi.unstubAllGlobals()
  })

  it('does not re-render the sidebar on a keystroke, but does on a navigation', async () => {
    render(<App />)
    await openFixture()
    fireEvent.click(pagesSection().getByRole('button', { name: 'Welcome' }))
    await waitFor(() => expect(editor().setContents[0]).toContain('This is Folio'))

    const before = dayLabelCalls.count
    // The keystroke re-renders App (the save indicator appears) while the
    // sidebar's props are unchanged, so the memoized sidebar does not run.
    await act(async () => {
      editor().emitChange('a keystroke')
    })
    expect(screen.getByRole('status')).toBeTruthy()
    expect(dayLabelCalls.count).toBe(before)

    // A navigation does change what the sidebar shows, so it re-renders.
    fireEvent.click(pagesSection().getByRole('button', { name: 'Reading' }))
    expect(dayLabelCalls.count).toBeGreaterThan(before)
    vi.unstubAllGlobals()
  })

  it("Today opens the current day's journal and records it", async () => {
    render(<App />)
    const tree = await openFixture()
    const today = new Date()
    const todayPath = `journals/${localDayString(today)}.md`
    // Leave today's journal for a page, so the control has to bring it back.
    fireEvent.click(pagesSection().getByRole('button', { name: 'Welcome' }))
    await waitFor(() => expect(screen.getByTitle('pages/Welcome.md')).toBeTruthy())

    fireEvent.click(screen.getByRole('button', { name: 'Today' }))
    await waitFor(() => expect(screen.getByTitle(todayPath)).toBeTruthy())
    // The open day is marked in the calendar, and the open was recorded like
    // any other navigation: Back lands on the page it displaced.
    expect(screen.getByRole('button', { name: dayLabel(today) }).getAttribute('aria-current')).toBe(
      'date',
    )
    fireEvent.click(back())
    await waitFor(() => expect(openRow()).toBe('Welcome'))

    // The fixture has no file for today, and merely opening created none.
    const journalsDir = tree.children.get('journals') as FakeDirectoryHandle
    expect(journalsDir.children.size).toBe(3)
    vi.unstubAllGlobals()
  })
})

// search-assets-by-name: a vault file is findable by name from the one surface
// that is already the app's "find the thing" gesture, and selecting it opens the
// file rather than navigating (ADR-0021).
describe('search over the vault assets (search-assets-by-name)', () => {
  const search = () => screen.getByLabelText('Search notes') as HTMLInputElement

  it('finds a file by name and opens it without navigating', async () => {
    const tree = buildTree({
      pages: { 'Report.md': 'no references here' },
      journals: { '2026-09-02.md': 'start' },
      assets: { 'q3-report.pdf': 'pdf bytes' },
    })
    const tab = { opener: null, location: { href: '' }, close: vi.fn() }
    const opened = vi.fn(() => tab)
    vi.stubGlobal('open', opened)

    render(<App />)
    await openFixture(tree)
    fireEvent.click(await screen.findByRole('button', { name: 'Report' }))

    fireEvent.change(search(), { target: { value: 'q3-report' } })
    const row = await screen.findByRole('option', { name: /q3-report\.pdf/ })
    const dropdown = screen.getByRole('listbox', { name: 'Search results' })
    expect(within(dropdown).getByText('Assets')).toBeTruthy()

    fireEvent.click(row)
    await waitFor(() => expect(opened).toHaveBeenCalledTimes(1))
    expect(tab.location.href).toMatch(/^blob:/)
    // Opening a file is not navigation: the same page is still open behind it.
    expect(editor().setContents[0]).toContain('no references here')
    vi.unstubAllGlobals()
  })

  it('does not match the contents of a file', async () => {
    const tree = buildTree({
      pages: { 'Report.md': 'plain body' },
      journals: { '2026-09-02.md': 'start' },
      assets: { 'report.pdf': 'confidential revenue figures' },
    })
    render(<App />)
    await openFixture(tree)
    fireEvent.change(search(), { target: { value: 'confidential' } })
    await waitFor(() => expect(screen.getByText(/No matches for/)).toBeTruthy())
    vi.unstubAllGlobals()
  })

  it('selects a file from the full results view and keeps the view', async () => {
    const tree = buildTree({
      pages: { 'Report.md': 'plain body' },
      journals: { '2026-09-02.md': 'start' },
      assets: { 'q3-report.pdf': 'pdf bytes' },
    })
    const tab = { opener: null, location: { href: '' }, close: vi.fn() }
    const opened = vi.fn(() => tab)
    vi.stubGlobal('open', opened)

    render(<App />)
    await openFixture(tree)
    fireEvent.change(search(), { target: { value: 'q3-report' } })
    fireEvent.click(await screen.findByRole('button', { name: /See all/ }))

    const view = await screen.findByRole('main', { name: 'Search results' })
    fireEvent.click(within(view).getByRole('button', { name: /q3-report\.pdf/ }))
    await waitFor(() => expect(opened).toHaveBeenCalledTimes(1))
    // The view is still there: nothing navigated, so there is no page to return to.
    expect(screen.getByRole('main', { name: 'Search results' })).toBeTruthy()
    vi.unstubAllGlobals()
  })
})

describe('whiteboards (add-whiteboards)', () => {
  it('opens a board from a board-reference badge and returns via Back', async () => {
    boardInstances.list.length = 0
    render(<App />)
    const tree = buildTree({
      pages: { 'Ideas.md': 'A sketch: #!Migration' },
      boards: { 'Migration.excalidraw': '{"type":"excalidraw","elements":[]}' },
    })
    await openFixture(tree)
    fireEvent.click(pagesSection().getByRole('button', { name: 'Ideas' }))
    await waitFor(() => expect(editor().content).toContain('#!Migration'))

    act(() => editor().emitReferenceClick('Migration', 'board'))
    const board = await screen.findByTestId('board-view')
    // The board's file text reached the host, and the editor pane is gone.
    expect(board.getAttribute('data-scene')).toContain('"type":"excalidraw"')
    expect(screen.queryByRole('main')).toBeNull()

    // Back returns to the page that referenced it (the trail recorded the board).
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    await waitFor(() => expect(screen.getByRole('main')).toBeTruthy())
  })

  it('lists a board in the sidebar and opens it', async () => {
    boardInstances.list.length = 0
    render(<App />)
    const tree = buildTree({
      pages: { 'Ideas.md': 'nothing' },
      boards: { 'Migration.excalidraw': '{}' },
    })
    await openFixture(tree)
    fireEvent.click(section('Boards').getByRole('button', { name: 'Migration.excalidraw' }))
    expect(await screen.findByTestId('board-view')).toBeTruthy()
  })

  it('shows the pages that reference the open board', async () => {
    boardInstances.list.length = 0
    render(<App />)
    const tree = buildTree({
      pages: { 'Ideas.md': 'A sketch: #!Migration' },
      boards: { 'Migration.excalidraw': '{}' },
    })
    await openFixture(tree)
    fireEvent.click(section('Boards').getByRole('button', { name: 'Migration.excalidraw' }))
    await screen.findByTestId('board-view')
    const panel = within(screen.getByRole('complementary', { name: 'Page sidebar' }))
    expect(panel.getByText('Referenced by')).toBeTruthy()
    await waitFor(() => expect(panel.getByRole('button', { name: 'Ideas' })).toBeTruthy())
  })
})
