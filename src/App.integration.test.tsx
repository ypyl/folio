import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import App from './App'
import styles from './components/JournalCalendar.module.css'
import sidebarStyles from './components/Sidebar.module.css'
import railStyles from './components/FolderRail.module.css'
import metaStyles from './components/MetaPanel.module.css'
import { FakeFileHandle, buildTree, type FakeDirectoryHandle } from './vault/fakeHandle'
import { FileSystemVaultStorage } from './vault/fs'
import { dayLabel } from './components/months'
import { localDayString } from './vault/index'
import type { EditorAdapter } from './editor/editor'
import { COMPACT_QUERY } from './compact'

// jsdom 30 has no <dialog> modal API, so `showModal()` cannot open the
// presentation dialog and role queries would treat it as hidden. Stub the two
// methods so the component's real open/close path runs.
Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
  configurable: true,
  writable: true,
  value(this: HTMLDialogElement) {
    this.setAttribute('open', '')
  },
})
Object.defineProperty(HTMLDialogElement.prototype, 'close', {
  configurable: true,
  writable: true,
  value(this: HTMLDialogElement) {
    this.removeAttribute('open')
  },
})

// Replace the real editor transport with FakeEditor for App-level tests
// (design D1). Instances are registered so tests can drive edits and assert
// what each page's editor was seeded with.
const editorInstances = vi.hoisted(() => ({ list: [] as EditorAdapter[] }))
vi.mock('./editor/codemirror', async () => {
  const { FakeEditor } = await import('./editor/fakeEditor')
  return {
    CodeMirrorAdapter: class extends FakeEditor {
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
  list: [] as {
    scene: string
    token: string | null
    onChange: (scene: string) => void
  }[],
}))
vi.mock('./editor/boardView', () => ({
  BoardView: ({
    initialScene,
    boardToken,
    onChange,
  }: {
    initialScene: string
    boardToken: string | null
    onChange: (s: string) => void
  }) => {
    boardInstances.list.push({ scene: initialScene, token: boardToken, onChange })
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

// The calendar only renders one month and the app opens today's journal, so the
// suite is time-sensitive. Freeze Date (only Date, not timers: waitFor and the
// debounced save stay real) to the fixture's month, or the suite goes red the
// moment the wall clock leaves September 2026.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 8, 15))
})
afterEach(() => {
  vi.useRealTimers()
})

type FakeView = EditorAdapter & {
  content: string
  blocks: { type: string; html: string }[]
  setContents: string[]
  insertions: string[]
  chords: string[]
  highlights: number[][]
  focuses: number
  emitChange: (markdown: string) => void
  emitReferenceClick: (target: string, kind?: 'page' | 'board') => void
  suggest: (query: string) => import('./vault/suggest').Suggestion[]
  suggestFiles: (query: string, onlyImages: boolean) => import('./vault/suggest').Suggestion[]
}

// The most recently mounted editor instance.
const editor = () => editorInstances.list[editorInstances.list.length - 1] as FakeView

const pane = () => screen.getByRole('main')

// Page rows live in the Pages section, so a row query says which section it
// means. Sections are `details` elements whose summary carries the title.
const section = (title: string, root: HTMLElement = document.body) =>
  within((within(root).getByText(title) as HTMLElement).closest('details') as HTMLElement)
const filesSection = () => section('Files', document.getElementById('sidebar-pane') as HTMLElement)

/** The Links section, opened so its rows are reachable (it is open by
 *  default; one accordion replaced Backlinks and Forwardlinks). */
const links = () => {
  const el = (within(document.body).getByText('Links') as HTMLElement).closest(
    'details',
  ) as HTMLDetailsElement
  el.open = true
  return within(el)
}

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

/** Open the search spotlight with its chord and return its input
 *  (replace-header-with-spotlight: search is a modal, not a header field).
 *  While the spotlight is already open the chord is a no-op and the same input
 *  is returned, so a call site can use it as "get (or open) the search". */
function searchInput(): HTMLInputElement {
  fireEvent.keyDown(document, { key: 'k', ctrlKey: true })
  return screen.getByLabelText('Search notes') as HTMLInputElement
}

describe('application shell', () => {
  it('renders the shell chrome with the open-a-folder empty state', async () => {
    // The open-folder hint is the supported-browser case: stub the picker the
    // shell is gated on (warn-unsupported-browser).
    vi.stubGlobal('showDirectoryPicker', vi.fn())
    try {
      render(<App />)
      expect(screen.getByRole('button', { name: 'Folio, go home' })).toBeTruthy()
      expect(screen.getByRole('button', { name: 'Open search' })).toBeTruthy()
      expect(screen.getByText('Journal')).toBeTruthy()
      expect(screen.getByText('Files')).toBeTruthy()
      expect(screen.getByText('Links')).toBeTruthy()
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
    await waitFor(() => expect(editor().setContents[0]).toBe('\n'))
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

  it('lists the live file count in the status bar', async () => {
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
    await waitFor(() => expect(editor().setContents[0]).toBe('\n'))
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
    expect(await (await file.getFile()).text()).toBe('Started the day in the journal.\n\n')
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
      filesSection().getByRole('button', { name: 'Reading' }).getAttribute('aria-current'),
    ).toBe('page')
    // Only the open page is marked: the other row keeps its plain state.
    expect(
      filesSection().getByRole('button', { name: 'Welcome' }).getAttribute('aria-current'),
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

  it('orders backlinks by last-edited, with a path tiebreak', async () => {
    const tree = buildTree({
      pages: {
        'Topic.md': 'The topic.',
        'Alpha.md': 'See #Topic.',
        'Zeta.md': 'Also #Topic.',
        'Recent.md': 'Newest #Topic.',
      },
    })
    const pages = pagesDir(tree)
    const at = (name: string, mtime: number) => {
      const file = pages.children.get(name) as FakeFileHandle
      file.lastModified = mtime
    }
    // Alpha and Zeta tie, so the path tiebreak decides; Recent is newest and
    // leads despite sorting last alphabetically.
    at('Alpha.md', 100)
    at('Zeta.md', 100)
    at('Recent.md', 200)

    render(<App />)
    await openFixture(tree)
    fireEvent.click(await screen.findByRole('button', { name: 'Topic' }))
    await waitFor(() =>
      expect(section('Links').getByRole('button', { name: 'Recent' })).toBeTruthy(),
    )
    const labels = section('Links')
      .getAllByRole('button')
      .map((b) => b.textContent)
    expect(labels).toEqual(['inRecent', 'inAlpha', 'inZeta'])
    vi.unstubAllGlobals()
  })

  it('lists forwardlinks in the order the page references them', async () => {
    const tree = buildTree({
      pages: {
        'Hub.md': 'See #Zulu then #Alpha.',
        'Zulu.md': 'Zulu.',
        'Alpha.md': 'Alpha.',
      },
    })
    render(<App />)
    await openFixture(tree)
    fireEvent.click(await screen.findByRole('button', { name: 'Hub' }))
    const forward = links()
    await forward.findByRole('button', { name: 'Zulu' })
    // Document order, not alphabetical: Zulu is referenced first (each `out`).
    expect(forward.getAllByRole('button').map((b) => b.textContent)).toEqual([
      'outZulu',
      'outAlpha',
    ])
    vi.unstubAllGlobals()
  })

  it("lists a page's files as assets then boards, each in appearance order", async () => {
    boardInstances.list.length = 0
    const tree = buildTree({
      pages: { 'Hub.md': 'See #!Migration then [report](assets/q3-report.pdf).' },
      boards: { 'Migration.excalidraw': '{}' },
      assets: { 'q3-report.pdf': 'pdf' },
    })
    render(<App />)
    await openFixture(tree)
    fireEvent.click(await screen.findByRole('button', { name: 'Hub' }))
    const forward = links()
    await forward.findByRole('button', { name: 'q3-report.pdf' })
    // The Links list holds the page's files — assets first, then boards, both
    // in document order, so a board named before an asset still follows it —
    // each badged by kind (merge-link-sections).
    expect(forward.getAllByRole('button').map((b) => b.textContent)).toEqual([
      'aq3-report.pdf',
      'bMigration.excalidraw',
    ])
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

    // The file is listed in the one Links list, named for the file, and is not
    // dimmed: an asset row exists only for a file the vault holds.
    const forward = links()
    const row = await forward.findByRole('button', { name: 'q3-report.pdf' })
    expect(row.className).not.toContain('dimmed')
    expect(row.getAttribute('aria-current')).toBeNull()
    // The file row is in the list, so the list is not empty.
    expect(forward.queryByText('No links yet.')).toBeNull()

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

    // Path-ordered, labelled by the path inside assets/. The asset rows trail
    // the page rows and carry an `a` badge.
    const rows = filesSection()
      .getAllByRole('button')
      .map((b) => b.textContent)
    expect(rows).toEqual(['Report', 'aq3-report.pdf', 'ashot.png'])

    // The Files section is open by default, so its rows are reachable.
    const sidebar = document.getElementById('sidebar-pane') as HTMLElement
    const files = [...sidebar.querySelectorAll('details')].find(
      (d) => d.querySelector('summary')?.textContent === 'Files',
    ) as HTMLDetailsElement
    expect(files.hasAttribute('open')).toBe(true)

    fireEvent.click(filesSection().getByRole('button', { name: 'shot.png' }))
    await waitFor(() => expect(opened).toHaveBeenCalledTimes(1))
    expect(tab.location.href).toMatch(/^blob:/)
    vi.unstubAllGlobals()
  })

  it('orders the Files listing pages, then boards, then assets', async () => {
    render(<App />)
    const tree = buildTree({
      pages: { 'Log.md': 'no references here' },
      boards: { 'sprint-14.excalidraw': '{}', 'kitchen.excalidraw': '{}' },
      assets: { 'shot.png': 'png bytes', 'q3-report.pdf': 'pdf bytes' },
    })
    await openFixture(tree)
    await screen.findByRole('button', { name: 'Log' })
    // Pages lead (one here), then boards in path order (each `b`-badged), then
    // assets in path order (each `a`-badged).
    const titles = filesSection()
      .getAllByRole('button')
      .map((b) => b.textContent)
    expect(titles).toEqual([
      'Log',
      'bkitchen.excalidraw',
      'bsprint-14.excalidraw',
      'aq3-report.pdf',
      'ashot.png',
    ])
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
    expect(await screen.findByText('Links appear once a page is open.')).toBeTruthy()
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
    expect(await (await file.getFile()).text()).toBe('edited welcome body\n\n')
    vi.unstubAllGlobals()
  })

  it('leaving a page before the save keeps the draft and restores it on return', async () => {
    render(<App />)
    await openFixture()
    fireEvent.click(await screen.findByRole('button', { name: 'Welcome' }))
    editor().emitChange('draft of welcome')
    fireEvent.click(await screen.findByRole('button', { name: 'Reading' }))
    // Welcome now sits in the trail too, so name the Pages row.
    fireEvent.click(filesSection().getByRole('button', { name: 'Welcome' }))

    // The fresh Welcome editor mounts with the draft, not the indexed content.
    const reopened = editor()
    await waitFor(() => expect(reopened.setContents[0]).toBe('draft of welcome\n\n'))
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
    expect(await (await file.getFile()).text()).toBe('second edit\n\n')
    vi.unstubAllGlobals()
  })
})

describe('a page ends with an empty line (add-trailing-empty-line)', () => {
  it('shows the empty line on open and leaves the file untouched', async () => {
    render(<App />)
    const tree = await openFixture(buildTree({ pages: { 'NoLine.md': 'Done' } }))
    fireEvent.click(await screen.findByRole('button', { name: 'NoLine' }))
    await waitFor(() => expect(editor().setContents[0]).toBe('Done\n\n'))
    // Opening does not write: the file still ends at its last content line.
    const file = pagesDir(tree).children.get('NoLine.md') as FakeFileHandle
    expect(await (await file.getFile()).text()).toBe('Done')
    vi.unstubAllGlobals()
  })

  it('writes exactly one trailing empty line on save', async () => {
    render(<App />)
    const tree = await openFixture(buildTree({ pages: { 'NoLine.md': 'Done' } }))
    fireEvent.click(await screen.findByRole('button', { name: 'NoLine' }))
    await waitFor(() => expect(editor().setContents[0]).toBe('Done\n\n'))
    editor().emitChange('Done more')
    // Observe the dirty state first: "no status" is also true before React has
    // rendered the edit, so the wait below could pass on a clean pane and the
    // file assertion would read the pre-edit content.
    const status = await screen.findByRole('status')
    expect(status.textContent).toBe('Unsaved changes')
    await waitFor(() => expect(screen.queryByRole('status')).toBeNull(), { timeout: 3000 })
    const file = pagesDir(tree).children.get('NoLine.md') as FakeFileHandle
    expect(await (await file.getFile()).text()).toBe('Done more\n\n')
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
    expect(editor().content).toBe('![photo](assets/photo.png)\n\n')
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
    expect(filesSection().getByRole('button', { name: 'Ideas' }).getAttribute('aria-current')).toBe(
      'page',
    )
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
    await waitFor(() => expect(editor().setContents[0]).toBe('\n'))

    // First edit reads as a brand-new page, not an edit to an existing file.
    editor().emitChange('Notes on how the shell fits together')
    const status = await screen.findByRole('status')
    expect(status.textContent).toBe('New page: created on first save')

    // The save materializes the file on disk and clears the indicator.
    await waitFor(() => expect(screen.queryByRole('status')).toBeNull(), { timeout: 3000 })
    const file = pagesDir(tree).children.get('architecture.md') as FakeFileHandle
    expect(await (await file.getFile()).text()).toBe('Notes on how the shell fits together\n\n')
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
    await waitFor(() => expect(editor().setContents[0]).toBe('\n'))
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
    await waitFor(() => expect(editor().setContents[0]).toBe('\n'))

    // Writing into the day reads as a brand-new page, then materializes it.
    editor().emitChange('Wrote a journal entry')
    const status = await screen.findByRole('status')
    expect(status.textContent).toBe('New page: created on first save')
    await waitFor(() => expect(screen.queryByRole('status')).toBeNull(), { timeout: 3000 })
    const file = journalsDir.children.get('2026-09-18.md') as FakeFileHandle
    expect(await (await file.getFile()).text()).toBe('Wrote a journal entry\n\n')

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
    await waitFor(() => expect(editor().setContents[0]).toBe('\n'))
    expect(within(pane()).queryByText('Your notes appear here.')).toBeNull()
    expect(within(pane()).queryByRole('heading', { level: 1, name: 'Welcome' })).toBeNull()
    vi.unstubAllGlobals()
  })
})
describe('content search over the real index (search spec)', () => {
  it('is disabled before a vault folder opens', () => {
    render(<App />)
    expect(
      (screen.getByRole('button', { name: 'Open search' }) as HTMLButtonElement).disabled,
    ).toBe(true)
    // The chord is inert without a vault, so the spotlight never appears.
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('opens a page from a search result', async () => {
    render(<App />)
    await openFixture()
    await screen.findByRole('button', { name: 'Welcome' }) // index built: search is enabled
    const search = searchInput()
    fireEvent.change(search, { target: { value: 'backlinks' } })
    // 'backlinks' matches Ideas.md (page) and journals/2026-09-03.md (journal).
    await waitFor(() => expect(screen.getAllByRole('option').length).toBe(2))
    fireEvent.click(screen.getByRole('option', { name: /^Ideas/ }))
    await waitFor(() =>
      expect(editor().setContents[0]).toContain('Half-formed thoughts worth keeping'),
    )
    vi.unstubAllGlobals()
  })

  it('keeps the located block framed after leaving the page and coming back', async () => {
    render(<App />)
    await openFixture()
    await screen.findByRole('button', { name: 'Welcome' })
    fireEvent.change(searchInput(), { target: { value: 'backlinks' } })
    await waitFor(() => expect(screen.getAllByRole('option').length).toBe(2))
    fireEvent.click(screen.getByRole('option', { name: /^Ideas/ }))
    await waitFor(() => expect(editor().highlights.length).toBeGreaterThan(0))
    const located = editor().highlights[editor().highlights.length - 1]
    expect(located).toEqual([expect.any(Number)])

    // Leave the located page: a navigation naming no block clears nothing, so
    // the page it lands on is handed no frame.
    fireEvent.click(filesSection().getByRole('button', { name: 'Welcome' }))
    await waitFor(() => expect(editor().content).toContain('This is Folio'))
    expect(editor().highlights[editor().highlights.length - 1]).toEqual([])

    // Come back, with no search: the frame belongs to the page, so it is there.
    fireEvent.click(filesSection().getByRole('button', { name: 'Ideas' }))
    await waitFor(() => expect(editor().highlights).toContainEqual(located))

    // And it comes back through page history too, which navigates by path and
    // names no block.
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    await waitFor(() => expect(editor().content).toContain('This is Folio'))
    fireEvent.click(screen.getByRole('button', { name: 'Forward' }))
    await waitFor(() => expect(editor().highlights).toContainEqual(located))
    vi.unstubAllGlobals()
  })

  it('frames every block holding the match when a result opens', async () => {
    render(<App />)
    await openFixture(buildTree({ pages: { 'Notes.md': '# dog\n\nBody dog\n\nMore dog\n' } }))
    await screen.findByRole('button', { name: 'Notes' })
    fireEvent.change(searchInput(), { target: { value: 'dog' } })
    await waitFor(() => expect(screen.getAllByRole('option').length).toBe(1))
    fireEvent.click(screen.getByRole('option', { name: /^Notes/ }))
    // The search already knows every occurrence; the pane is handed each block
    // it falls in, not only the first (frame-every-matching-block).
    await waitFor(() => expect(editor().highlights.length).toBeGreaterThan(0))
    expect(editor().highlights[editor().highlights.length - 1]).toEqual([0, 1, 2])
    vi.unstubAllGlobals()
  })

  it('opens a journal day from a search result like the calendar would', async () => {
    render(<App />)
    await openFixture()
    await screen.findByRole('button', { name: 'Welcome' }) // index built: search is enabled
    const search = searchInput()
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
    const search = searchInput()
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
    // The folder switch closes the spotlight; its folder-keyed remount clears
    // the query (search: scoped to the active vault).
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(searchInput().value).toBe('')
    expect(screen.queryByRole('listbox')).toBeNull()
    vi.unstubAllGlobals()
  })
})

describe('search results view (search-results-view spec)', () => {
  const search = () => searchInput()
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
    expect(screen.getByText('Links appear once a page is open.')).toBeTruthy()
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
    // Reopening the spotlight (query kept) restores the dropdown, and its
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
    expect(editor().setContents[0]).toBe('\n')
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
    expect(editor().setContents[0]).toBe('\n')
    expect([...pagesDir(tree).children.keys()].sort()).toEqual(before)
    vi.unstubAllGlobals()
  })
})

describe('pinned pages (add-pinned-pages)', () => {
  // The five fixture page rows in the Pages section, in DOM order (scoped to
  // the sidebar; the rail's brand is outside this region).
  const pageRowTitles = () =>
    within(screen.getByRole('complementary', { name: 'Notes' }))
      .getAllByRole('button')
      .map((b) => (b.textContent ?? '').trim())
      .filter((t) => ['Welcome', 'Inbox', 'Ideas', 'Folio', 'Reading'].includes(t))

  it('favorites a page from its row menu, persists, and unfavorites', async () => {
    render(<App />)
    const tree = await openFixture()
    const storage = new FileSystemVaultStorage(tree as unknown as FileSystemDirectoryHandle)
    await screen.findByRole('button', { name: 'Welcome' })

    // Favorite a page that is not even open, straight from its row's menu.
    fireEvent.contextMenu(filesSection().getByRole('button', { name: 'Welcome' }), {
      clientX: 40,
      clientY: 40,
    })
    fireEvent.click(screen.getByRole('menuitem', { name: 'Favorite' }))

    // The row gains the favorite style and leads the list; no extra control is
    // added to the row itself.
    await waitFor(() => expect(pageRowTitles()[0]).toBe('Welcome'))
    const welcomeRow = filesSection().getByRole('button', { name: 'Welcome' })
    expect(welcomeRow.getAttribute('data-pinned')).toBe('true')
    expect(welcomeRow.querySelector('svg')).toBeNull()
    // It persists in the vault meta file, not the app.
    expect(await storage.read('.folio/pins.md')).toContain('- pages/Welcome.md')

    // The menu now reads Unfavorite; activating it restores edit order and
    // clears the marker.
    fireEvent.contextMenu(filesSection().getByRole('button', { name: 'Welcome' }), {
      clientX: 40,
      clientY: 40,
    })
    fireEvent.click(screen.getByRole('menuitem', { name: 'Unfavorite' }))
    await waitFor(() =>
      expect(pageRowTitles()).toEqual(['Reading', 'Folio', 'Ideas', 'Inbox', 'Welcome']),
    )
    const welcomeRow2 = filesSection().getByRole('button', { name: 'Welcome' })
    expect(welcomeRow2.getAttribute('data-pinned')).toBeNull()
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
    await waitFor(() => expect(editor().setContents[0]).toBe('\n'))
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
    await waitFor(() => expect(editor().setContents[0]).toBe('\n'))
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
    for (const name of ['Undo Ctrl+Z', 'Open reference Ctrl+Enter', 'Search notes Ctrl+K']) {
      expect(control(name).disabled).toBe(true)
    }
    // The formatting rows are gone, so nothing offers a chord the editor cannot
    // claim (swap-editor-to-codemirror-live-preview).
    expect(screen.queryByRole('button', { name: /^Bold/ })).toBeNull()
  })

  it('enables the editor rows once a page is open and sends the chord to the editor', async () => {
    render(<App />)
    await openFixture()
    await openReference()
    expect(control('Undo Ctrl+Z').disabled).toBe(false)
    expect(control('Search notes Ctrl+K').disabled).toBe(false)
    fireEvent.click(control('Undo Ctrl+Z'))
    expect(editor().chords).toEqual(['Mod-z'])
    vi.unstubAllGlobals()
  })

  it('routes the app row through the document, focusing the search box', async () => {
    render(<App />)
    await openFixture()
    await openReference()
    fireEvent.click(control('Search notes Ctrl+K'))
    // The chord reaches the app's own document listener, which opens the
    // spotlight and focuses its input.
    await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText('Search notes')))
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
  // Back and Forward lead the status bar now (move-nav-controls-to-status-bar),
  // so they are queried globally rather than through the sidebar.
  const back = () => screen.getByRole('button', { name: 'Back' }) as HTMLButtonElement
  const forward = () => screen.getByRole('button', { name: 'Forward' }) as HTMLButtonElement
  // The page the sidebar marks as open.
  const openRow = () =>
    filesSection()
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
    fireEvent.click(filesSection().getByRole('button', { name: 'Welcome' }))
    fireEvent.click(filesSection().getByRole('button', { name: 'Reading' }))
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
    fireEvent.click(filesSection().getByRole('button', { name: 'Welcome' }))
    fireEvent.click(filesSection().getByRole('button', { name: 'Reading' }))
    fireEvent.click(filesSection().getByRole('button', { name: 'Folio' }))
    fireEvent.click(back()) // back to Reading
    await waitFor(() => expect(openRow()).toBe('Reading'))
    expect(forward().disabled).toBe(false)

    // A fresh navigation from a backed-out position starts a new line.
    fireEvent.click(filesSection().getByRole('button', { name: 'Inbox' }))
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
    fireEvent.click(filesSection().getByRole('button', { name: 'Welcome' }))
    fireEvent.click(filesSection().getByRole('button', { name: 'Reading' }))
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
    await waitFor(() => expect(editor().setContents[0]).toBe('\n'))

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
    await waitFor(() => expect(editor().setContents[0]).toBe('\n'))
    await waitFor(() => expect(back().disabled).toBe(false))

    expect(write).not.toHaveBeenCalled()
    expect([...pagesDir(tree).children.keys()].sort()).toEqual(before)
    write.mockRestore()
    vi.unstubAllGlobals()
  })

  it('does not re-render the sidebar on a keystroke, but does on a navigation', async () => {
    render(<App />)
    await openFixture()
    fireEvent.click(filesSection().getByRole('button', { name: 'Welcome' }))
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
    fireEvent.click(filesSection().getByRole('button', { name: 'Reading' }))
    expect(dayLabelCalls.count).toBeGreaterThan(before)
    vi.unstubAllGlobals()
  })

  it('keeps the row context menu off the typing path', async () => {
    render(<App />)
    await openFixture()
    fireEvent.click(filesSection().getByRole('button', { name: 'Welcome' }))
    await waitFor(() => expect(editor().setContents[0]).toContain('This is Folio'))

    // Open and dismiss the row menu: its state changes only on those gestures.
    fireEvent.contextMenu(filesSection().getByRole('button', { name: 'Welcome' }), {
      clientX: 40,
      clientY: 40,
    })
    expect(screen.getByRole('menu')).toBeTruthy()
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' })
    expect(screen.queryByRole('menu')).toBeNull()

    // Typing re-renders App (the save indicator) but creates no menu and does
    // not re-render the memoized sidebar.
    const before = dayLabelCalls.count
    await act(async () => {
      editor().emitChange('a keystroke')
    })
    expect(screen.queryByRole('menu')).toBeNull()
    expect(dayLabelCalls.count).toBe(before)
    vi.unstubAllGlobals()
  })

  it("Today opens the current day's journal and records it", async () => {
    render(<App />)
    const tree = await openFixture()
    const today = new Date()
    const todayPath = `journals/${localDayString(today)}.md`
    // Leave today's journal for a page, so the control has to bring it back.
    fireEvent.click(filesSection().getByRole('button', { name: 'Welcome' }))
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
  const search = () => searchInput()

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
    fireEvent.click(filesSection().getByRole('button', { name: 'Ideas' }))
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
    fireEvent.click(filesSection().getByRole('button', { name: 'Migration.excalidraw' }))
    expect(await screen.findByTestId('board-view')).toBeTruthy()
  })

  it('passes the open board its canonical reference token for the blank note', async () => {
    boardInstances.list.length = 0
    render(<App />)
    const tree = buildTree({
      pages: { 'Ideas.md': 'A sketch: #![[Migration topology]]' },
      boards: { 'Migration.excalidraw': '{}' },
    })
    await openFixture(tree)
    fireEvent.click(filesSection().getByRole('button', { name: 'Ideas' }))
    await waitFor(() => expect(editor().content).toContain('#![[Migration topology]]'))

    // A reference to a board with no file opens a blank board (the page rule).
    act(() => editor().emitReferenceClick('Migration topology', 'board'))
    await screen.findByTestId('board-view')
    // The host is handed the token the note prints: the board's filename stem
    // in the canonical form for a spaced name, which is bracketed.
    expect(boardInstances.list.at(-1)?.token).toBe('#![[Migration topology]]')
    // Opening a board with no file creates none.
    const boardsDir = tree.children.get('boards') as FakeDirectoryHandle
    expect(boardsDir.children.get('Migration topology.excalidraw')).toBeUndefined()
    vi.unstubAllGlobals()
  })

  it('names an existing board by its stem token', async () => {
    boardInstances.list.length = 0
    render(<App />)
    const tree = buildTree({
      pages: { 'Ideas.md': 'nothing' },
      boards: { 'sprint-14.excalidraw': '{}' },
    })
    await openFixture(tree)
    fireEvent.click(filesSection().getByRole('button', { name: 'sprint-14.excalidraw' }))
    await screen.findByTestId('board-view')
    expect(boardInstances.list.at(-1)?.token).toBe('#!sprint-14')
  })

  it('shows the pages that reference the open board', async () => {
    boardInstances.list.length = 0
    render(<App />)
    const tree = buildTree({
      pages: { 'Ideas.md': 'A sketch: #!Migration' },
      boards: { 'Migration.excalidraw': '{}' },
    })
    await openFixture(tree)
    fireEvent.click(filesSection().getByRole('button', { name: 'Migration.excalidraw' }))
    await screen.findByTestId('board-view')
    const panel = within(screen.getByRole('complementary', { name: 'Page sidebar' }))
    expect(panel.getByText('Referenced by')).toBeTruthy()
    await waitFor(() => expect(panel.getByRole('button', { name: 'Ideas' })).toBeTruthy())
  })

  it("orders a board's Referenced by rows by last-edited", async () => {
    boardInstances.list.length = 0
    const tree = buildTree({
      pages: { 'First.md': 'See #!Migration.', 'Second.md': 'Also #!Migration.' },
      boards: { 'Migration.excalidraw': '{}' },
    })
    const pages = pagesDir(tree)
    ;(pages.children.get('First.md') as FakeFileHandle).lastModified = 100
    ;(pages.children.get('Second.md') as FakeFileHandle).lastModified = 200
    render(<App />)
    await openFixture(tree)
    fireEvent.click(filesSection().getByRole('button', { name: 'Migration.excalidraw' }))
    await screen.findByTestId('board-view')
    await waitFor(() =>
      expect(section('Referenced by').getByRole('button', { name: 'Second' })).toBeTruthy(),
    )
    const labels = section('Referenced by')
      .getAllByRole('button')
      .map((b) => b.textContent)
    expect(labels).toEqual(['inSecond', 'inFirst'])
    vi.unstubAllGlobals()
  })
})

describe('board references in the meta panel (board-references-in-panel)', () => {
  it("lists a page's board reference in References and opens the board", async () => {
    boardInstances.list.length = 0
    render(<App />)
    const tree = buildTree({
      pages: { 'Ideas.md': 'A sketch: #!Migration' },
      boards: { 'Migration.excalidraw': '{}' },
    })
    await openFixture(tree)
    fireEvent.click(filesSection().getByRole('button', { name: 'Ideas' }))

    const row = await links().findByRole('button', {
      name: 'Migration.excalidraw',
    })
    expect(row.className).not.toContain('dimmed')

    fireEvent.click(row)
    expect(await screen.findByTestId('board-view')).toBeTruthy()
  })

  it('lists one row when a token and a path link name one board', async () => {
    boardInstances.list.length = 0
    render(<App />)
    const tree = buildTree({
      pages: { 'Ideas.md': '#!Migration and [x](boards/Migration.excalidraw)' },
      boards: { 'Migration.excalidraw': '{}' },
    })
    await openFixture(tree)
    fireEvent.click(filesSection().getByRole('button', { name: 'Ideas' }))
    const rows = await links().findAllByRole('button', {
      name: 'Migration.excalidraw',
    })
    expect(rows).toHaveLength(1)
  })

  it('dims a board reference the vault does not hold', async () => {
    boardInstances.list.length = 0
    render(<App />)
    const tree = buildTree({ pages: { 'Ideas.md': 'A sketch: #!Architecture' } })
    await openFixture(tree)
    fireEvent.click(filesSection().getByRole('button', { name: 'Ideas' }))
    const row = await links().findByRole('button', {
      name: 'Architecture.excalidraw',
    })
    expect(row.className).toContain('dimmed')
  })
})

describe('collapsible sidebars (add-collapsible-sidebars spec)', () => {
  it('renders a full-height strip for each side, both expanded', () => {
    render(<App />)
    const left = screen.getByRole('button', { name: 'Collapse left navigation' })
    expect(left.getAttribute('aria-expanded')).toBe('true')
    expect(left.getAttribute('aria-controls')).toBe('folder-rail sidebar-pane')
    const right = screen.getByRole('button', { name: 'Collapse meta panel' })
    expect(right.getAttribute('aria-expanded')).toBe('true')
    expect(right.getAttribute('aria-controls')).toBe('meta-panel')
  })

  it('folds the rail and the sidebar away and back without touching the editor', () => {
    render(<App />)
    const pane = document.getElementById('sidebar-pane') as HTMLElement
    const rail = document.getElementById('folder-rail') as HTMLElement
    expect(pane.className).not.toContain(sidebarStyles.collapsed)
    expect(rail.className).not.toContain(railStyles.collapsed)

    fireEvent.click(screen.getByRole('button', { name: 'Collapse left navigation' }))
    // Both keep their nodes (so accordion state survives) and take the
    // collapsed class; the strip flips its name and state.
    expect(document.getElementById('sidebar-pane')).toBe(pane)
    expect(document.getElementById('folder-rail')).toBe(rail)
    expect(pane.className).toContain(sidebarStyles.collapsed)
    expect(rail.className).toContain(railStyles.collapsed)
    const expanded = screen.getByRole('button', { name: 'Expand left navigation' })
    expect(expanded.getAttribute('aria-expanded')).toBe('false')

    fireEvent.click(expanded)
    expect(pane.className).not.toContain(sidebarStyles.collapsed)
    expect(rail.className).not.toContain(railStyles.collapsed)
    expect(screen.getByRole('button', { name: 'Open search' })).toBeTruthy()
    expect(
      screen
        .getByRole('button', { name: 'Collapse left navigation' })
        .getAttribute('aria-expanded'),
    ).toBe('true')
  })

  it('keeps a collapsed pane mounted so its sections survive the round trip', () => {
    render(<App />)
    const summary = screen.getByText('Keyboard shortcuts')
    const details = summary.closest('details') as HTMLDetailsElement
    expect(details.open).toBe(false)
    fireEvent.click(summary)
    expect(details.open).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: 'Collapse meta panel' }))
    expect((document.getElementById('meta-panel') as HTMLElement).className).toContain(
      metaStyles.collapsed,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Expand meta panel' }))

    const reopened = screen.getByText('Keyboard shortcuts').closest('details') as HTMLDetailsElement
    expect(reopened).toBe(details)
    expect(reopened.open).toBe(true)
  })
})

// Revealing the open page in the Files listing (reveal-open-page-in-files, the
// status-bar reveal requirement): the status bar's page name is the trigger and
// the sidebar does the work. The reveal is a view operation, so it re-renders
// nothing and writes nothing.
describe('revealing the open page in the Files listing (reveal-open-page-in-files)', () => {
  const scrollIntoView = vi.fn()

  // jsdom ships no scrollIntoView, so the test defines the seam the browser
  // provides; focus works in both.
  beforeEach(() => {
    Object.defineProperty(Element.prototype, 'scrollIntoView', {
      value: scrollIntoView,
      configurable: true,
      writable: true,
    })
  })
  afterEach(() => {
    scrollIntoView.mockClear()
    Reflect.deleteProperty(Element.prototype, 'scrollIntoView')
  })

  const revealButton = (name: string) =>
    screen.getByRole('button', { name: `Reveal ${name} in Files` })

  it("reveals the open page's row from the status bar", async () => {
    render(<App />)
    await openFixture()
    fireEvent.click(filesSection().getByRole('button', { name: 'Welcome' }))
    await waitFor(() => expect(screen.getByTitle('pages/Welcome.md')).toBeTruthy())

    fireEvent.click(revealButton('Welcome.md'))

    const row = filesSection().getByRole('button', { name: 'Welcome' })
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' })
    expect(document.activeElement).toBe(row)
    // View-only: the page stays open, and only the page name is a control —
    // the directory crumb beside it stays inert text.
    const crumb = screen.getByTitle('pages/Welcome.md')
    expect(crumb.querySelectorAll('button')).toHaveLength(1)
    expect(revealButton('Welcome.md')).toBeTruthy()
    vi.unstubAllGlobals()
  })

  it('unfolds a folded left navigation before revealing', async () => {
    render(<App />)
    await openFixture()
    fireEvent.click(filesSection().getByRole('button', { name: 'Welcome' }))
    await waitFor(() => expect(screen.getByTitle('pages/Welcome.md')).toBeTruthy())

    fireEvent.click(screen.getByRole('button', { name: 'Collapse left navigation' }))
    const pane = document.getElementById('sidebar-pane') as HTMLElement
    expect(pane.className).toContain(sidebarStyles.collapsed)

    fireEvent.click(revealButton('Welcome.md'))

    // The pane unfolds first, then the row takes focus.
    await waitFor(() => expect(pane.className).not.toContain(sidebarStyles.collapsed))
    await waitFor(() =>
      expect(document.activeElement).toBe(filesSection().getByRole('button', { name: 'Welcome' })),
    )
    vi.unstubAllGlobals()
  })

  it('opens a collapsed Files section before revealing', async () => {
    render(<App />)
    await openFixture()
    fireEvent.click(filesSection().getByRole('button', { name: 'Welcome' }))
    await waitFor(() => expect(screen.getByTitle('pages/Welcome.md')).toBeTruthy())

    const files = (screen.getByText('Files') as HTMLElement).closest(
      'details',
    ) as HTMLDetailsElement
    files.open = false

    fireEvent.click(revealButton('Welcome.md'))

    expect(files.open).toBe(true)
    expect(document.activeElement).toBe(filesSection().getByRole('button', { name: 'Welcome' }))
    vi.unstubAllGlobals()
  })

  it("leaves a journal day's breadcrumb inert", async () => {
    render(<App />)
    await openFixture()
    const todayPath = `journals/${localDayString(new Date())}.md`
    await waitFor(() => expect(screen.getByTitle(todayPath)).toBeTruthy())
    // The open item is a day, not a Files row, so the name gates off.
    expect(screen.queryByRole('button', { name: /^Reveal / })).toBeNull()
    expect(screen.getByTitle(todayPath).querySelector('button')).toBeNull()
    vi.unstubAllGlobals()
  })

  it("leaves a board's breadcrumb inert", async () => {
    boardInstances.list.length = 0
    render(<App />)
    const tree = buildTree({
      pages: { 'Ideas.md': 'nothing' },
      boards: { 'Migration.excalidraw': '{}' },
    })
    await openFixture(tree)
    fireEvent.click(filesSection().getByRole('button', { name: 'Migration.excalidraw' }))
    await screen.findByTestId('board-view')
    // A board has a Files row but its name is not a control.
    expect(screen.getByTitle('boards/Migration.excalidraw').querySelector('button')).toBeNull()
    vi.unstubAllGlobals()
  })

  it('changes nothing but what it reveals', async () => {
    render(<App />)
    const tree = await openFixture()
    fireEvent.click(filesSection().getByRole('button', { name: 'Welcome' }))
    await waitFor(() => expect(editor().setContents[0]).toContain('This is Folio'))
    const pagesBefore = (tree.children.get('pages') as FakeDirectoryHandle).children.size

    fireEvent.click(revealButton('Welcome.md'))

    // Same page open, same editor seeding, no file materialized.
    expect(screen.getByTitle('pages/Welcome.md')).toBeTruthy()
    expect(editor().setContents[0]).toContain('This is Folio')
    expect((tree.children.get('pages') as FakeDirectoryHandle).children.size).toBe(pagesBefore)
    vi.unstubAllGlobals()
  })

  it('keeps the reveal off the typing path', async () => {
    render(<App />)
    await openFixture()
    fireEvent.click(filesSection().getByRole('button', { name: 'Welcome' }))
    await waitFor(() => expect(editor().setContents[0]).toContain('This is Folio'))

    // The reveal click re-renders nothing, so the memoized sidebar keeps its
    // prop identities (dayLabel runs once per rendered calendar cell).
    const before = dayLabelCalls.count
    fireEvent.click(revealButton('Welcome.md'))
    expect(dayLabelCalls.count).toBe(before)
    expect(scrollIntoView).toHaveBeenCalledTimes(1)

    // A keystroke re-renders App (the save indicator) but reveals nothing and
    // leaves focus where the reveal put it.
    await act(async () => {
      editor().emitChange('a keystroke')
    })
    expect(screen.getByRole('status')).toBeTruthy()
    expect(scrollIntoView).toHaveBeenCalledTimes(1)
    expect(dayLabelCalls.count).toBe(before)
    expect(document.activeElement).toBe(filesSection().getByRole('button', { name: 'Welcome' }))
    vi.unstubAllGlobals()
  })
})

describe('logseq import', () => {
  it('offers no import action where the browser has no picker', async () => {
    // jsdom has no showDirectoryPicker; stub it undefined so the test does not
    // inherit a picker another test left in place, and the action cannot be
    // performed (add-logseq-import).
    vi.stubGlobal('showDirectoryPicker', undefined)
    try {
      render(<App />)
      expect(await screen.findByText(/Chromium-based browser/)).toBeTruthy()
      expect(screen.queryByRole('button', { name: 'Import from Logseq' })).toBeNull()
    } finally {
      vi.unstubAllGlobals()
    }
  })

  it('imports a Logseq folder into a destination and opens it', async () => {
    const source = buildTree({
      pages: { 'Roadmap.md': 'See [[Ideas]]' },
      journals: { '2024_07_02.md': 'met a person' },
      assets: { 'shot.png': 'bytes' },
    })
    source.name = 'logseq'
    const dest = buildTree({})
    dest.name = 'folio'
    const picks: FakeDirectoryHandle[] = [source, dest]
    vi.stubGlobal(
      'showDirectoryPicker',
      vi.fn(async () => picks.shift() as unknown as FileSystemDirectoryHandle),
    )
    try {
      render(<App />)
      fireEvent.click(await screen.findByRole('button', { name: 'Import from Logseq' }))

      // The result summary lands, and the destination now holds the translated
      // files under Folio paths.
      expect(await screen.findByText('Import complete')).toBeTruthy()
      const pages = dest.children.get('pages') as FakeDirectoryHandle
      const journals = dest.children.get('journals') as FakeDirectoryHandle
      const assets = dest.children.get('assets') as FakeDirectoryHandle
      expect(pages.children.has('Roadmap.md')).toBe(true)
      expect(journals.children.has('2024-07-02.md')).toBe(true)
      expect(assets.children.has('shot.png')).toBe(true)

      // Continuing opens the imported destination as the active vault.
      fireEvent.click(screen.getByRole('button', { name: 'Continue' }))
      await waitFor(() => expect(screen.getByText('Roadmap')).toBeTruthy())
    } finally {
      vi.unstubAllGlobals()
    }
  })
})

// Presentations (add-presentations) are disabled for now
// (swap-editor-to-codemirror-live-preview): the row menu's Present entry is
// gone, because a deck derived from the Markdown source does not yet render at
// parity with the reading view. The view, its derivation, and their own tests
// are kept, so re-enabling it is the menu row again plus the two App-level tests
// this block used to hold.

// The Contents section (add-page-contents): the open page's headings, and a row
// that locates its heading without changing anything.
describe('page contents (add-page-contents)', () => {
  it("lists the open page's headings and locates one without changing the page", async () => {
    const write = vi.spyOn(FileSystemVaultStorage.prototype, 'write')
    try {
      render(<App />)
      const tree = buildTree({ pages: { 'Notes.md': '# Alpha\n\nBody text\n\n## Beta\n' } })
      await openFixture(tree)
      fireEvent.click(filesSection().getByRole('button', { name: 'Notes' }))
      await waitFor(() => expect(editor().content).toContain('Alpha'))

      const contents = section('Contents')
      expect(contents.getByRole('button', { name: 'Alpha' })).toBeTruthy()
      // `## Beta` is the third top-level block (heading, paragraph, heading).
      fireEvent.click(contents.getByRole('button', { name: 'Beta' }))
      await waitFor(() => expect(editor().highlights).toContainEqual([2]))

      // Locating is view-only: the page is the same and nothing is written.
      expect(editor().content).toContain('Alpha')
      expect(write).not.toHaveBeenCalled()
    } finally {
      write.mockRestore()
      vi.unstubAllGlobals()
    }
  })
})

// The app tour (add-app-tour spec): the rail's control, the overlay's steps, the
// region hooks it resolves, and the search chord's interaction. jsdom has no
// layout, so the cut-out's real geometry is held in tests/e2e/workspace.spec.ts.
describe('the app tour (add-app-tour spec)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  const tourControl = () => screen.getByRole('button', { name: 'Take the tour' })

  it('opens from the rail control and walks the shell regions', async () => {
    vi.stubGlobal('showDirectoryPicker', vi.fn())
    render(<App />)
    await screen.findByText('Open a folder to begin.')

    // Every region a step points at renders in the no-folder state, so a first
    // run can take the whole tour (the editor hook is on the brand screen's
    // <main>).
    for (const selector of [
      '#folder-rail',
      '#sidebar-pane',
      '[data-tour="editor"]',
      '#meta-panel',
      '[data-tour="status"]',
    ]) {
      expect(document.querySelector(selector)).toBeTruthy()
    }

    tourControl().focus()
    fireEvent.click(tourControl())
    const card = screen.getByRole('dialog', { name: 'App tour' })
    expect(card.textContent).toContain('Your folders')
    fireEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(card.textContent).toContain('Journal and Files')
    fireEvent.click(screen.getByRole('button', { name: 'Skip' }))
    expect(screen.queryByRole('dialog', { name: 'App tour' })).toBeNull()
    expect(document.activeElement).toBe(tourControl())
  })

  it('is closed by the search chord so the overlays do not stack', async () => {
    render(<App />)
    await openFixture()
    fireEvent.click(tourControl())
    expect(screen.getByRole('dialog', { name: 'App tour' })).toBeTruthy()

    searchInput()
    expect(screen.queryByRole('dialog', { name: 'App tour' })).toBeNull()
    expect(screen.getByLabelText('Search notes')).toBeTruthy()
  })

  it('drops the editor hook while the results view owns the main slot', async () => {
    render(<App />)
    await openFixture()
    await screen.findByRole('button', { name: 'Welcome' })
    expect(document.querySelector('[data-tour="editor"]')).toBeTruthy()

    fireEvent.change(searchInput(), { target: { value: 'folio' } })
    const seeAll = await screen.findByRole('button', { name: 'See all 4 results' })
    fireEvent.click(seeAll)
    expect(document.querySelector('[data-tour="editor"]')).toBeNull()
    // The other regions stay: only the main slot changed occupant.
    expect(document.querySelector('[data-tour="status"]')).toBeTruthy()
    expect(document.getElementById('meta-panel')).toBeTruthy()
  })
})

// The compact shell (add-compact-mobile-shell spec): one view at a time, chosen
// from the status bar's app-bar controls, with the Android Back step closing
// the view instead of leaving the app. jsdom applies no stylesheets and has no
// layout, so what these tests hold is the state that drives the composition —
// the shell's view class, the controls' pressed state, and the history entries.
// The layout those classes select is checked in a browser.
describe('the compact shell (add-compact-mobile-shell spec)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  /** Answer the shell's breakpoint as a phone would. The listener is a no-op:
   *  a test that crosses the breakpoint re-renders, which is what the real
   *  `change` event does. */
  function stubCompact(matches = true): void {
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({
        matches: matches && query === COMPACT_QUERY,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    )
  }

  const shell = () => document.querySelector('.app-shell') as HTMLElement
  const shownView = () =>
    (['nav', 'editor', 'meta'] as const).find((v) => shell().classList.contains(`view-${v}`))
  const navLayer = () => document.querySelector('.layer-nav') as HTMLElement
  /** A control that closes a view pops a history entry, which jsdom dispatches
   *  asynchronously; stub the step so a test can assert it was asked for. */
  const stubBack = () => vi.spyOn(window.history, 'back').mockImplementation(() => {})

  it('settles on the navigation view when nothing is open', async () => {
    stubCompact()
    render(<App />)
    // 'restoring' leads with the editor, because a stored vault is about to open
    // a page and the navigation view must not flash in front of it. With nothing
    // stored, the restore settles with nothing open and the navigation view —
    // where the folder picker's control lives — takes over.
    await waitFor(() => expect(shownView()).toBe('nav'))
  })

  it('leads with the editor view once a page is open', async () => {
    stubCompact()
    render(<App />)
    await openFixture()
    await waitFor(() => expect(shownView()).toBe('editor'))
  })

  it('shows one view at a time from the app bar, and its own control returns', async () => {
    stubCompact()
    const back = stubBack()
    try {
      render(<App />)
      await openFixture()
      expect(shownView()).toBe('editor')

      fireEvent.click(screen.getByRole('button', { name: 'Navigation' }))
      expect(shownView()).toBe('nav')
      expect(screen.getByRole('button', { name: 'Navigation' }).getAttribute('aria-pressed')).toBe(
        'true',
      )

      fireEvent.click(screen.getByRole('button', { name: 'Page details' }))
      expect(shownView()).toBe('meta')

      fireEvent.click(screen.getByRole('button', { name: 'Page details' }))
      expect(shownView()).toBe('editor')
      expect(
        screen.getByRole('button', { name: 'Page details' }).getAttribute('aria-pressed'),
      ).toBe('false')
    } finally {
      back.mockRestore()
    }
  })

  it('opens a view with a history entry, and closing it pops that entry', async () => {
    stubCompact()
    const back = stubBack()
    try {
      render(<App />)
      await openFixture()
      const push = vi.spyOn(window.history, 'pushState')
      try {
        fireEvent.click(screen.getByRole('button', { name: 'Navigation' }))
        expect(push).toHaveBeenCalledTimes(1)
        fireEvent.click(screen.getByRole('button', { name: 'Navigation' }))
        expect(back).toHaveBeenCalledTimes(1)
        // Closing pushes nothing: the entry it opened with is the one it pops.
        expect(push).toHaveBeenCalledTimes(1)
      } finally {
        push.mockRestore()
      }
    } finally {
      back.mockRestore()
    }
  })

  it('a landing view has no entry to pop and does not step back', async () => {
    stubCompact()
    const back = stubBack()
    try {
      render(<App />)
      // Nothing is open, so the navigation view leads without having been
      // chosen: activating its own control gives way to the editor and must
      // not take the browser back out of the app.
      await waitFor(() => expect(shownView()).toBe('nav'))
      const push = vi.spyOn(window.history, 'pushState')
      try {
        fireEvent.click(screen.getByRole('button', { name: 'Navigation' }))
        expect(shownView()).toBe('editor')
        expect(back).not.toHaveBeenCalled()
        expect(push).not.toHaveBeenCalled()
      } finally {
        push.mockRestore()
      }
    } finally {
      back.mockRestore()
    }
  })

  it('closes the shown view on the browser back step', async () => {
    stubCompact()
    render(<App />)
    await openFixture()
    fireEvent.click(screen.getByRole('button', { name: 'Navigation' }))
    expect(shownView()).toBe('nav')

    act(() => {
      window.dispatchEvent(new Event('popstate'))
    })
    expect(shownView()).toBe('editor')
  })

  it('shows the editor after a row is selected from a view', async () => {
    stubCompact()
    render(<App />)
    await openFixture()
    fireEvent.click(screen.getByRole('button', { name: 'Navigation' }))
    expect(shownView()).toBe('nav')

    fireEvent.click(within(navLayer()).getByRole('button', { name: 'Welcome' }))
    await waitFor(() => expect(shownView()).toBe('editor'))
    expect(editor().content).toContain('lightweight way')
  })

  it('takes focus back into the editor when a chosen view closes', async () => {
    stubCompact()
    const back = stubBack()
    try {
      render(<App />)
      await openFixture()
      const before = editor().focuses
      fireEvent.click(screen.getByRole('button', { name: 'Navigation' }))
      fireEvent.click(screen.getByRole('button', { name: 'Navigation' }))
      expect(editor().focuses).toBe(before + 1)
    } finally {
      back.mockRestore()
    }
  })

  it('shows no tour control on a narrow window', async () => {
    stubCompact()
    render(<App />)
    await waitFor(() => expect(shownView()).toBe('nav'))
    expect(screen.queryByRole('button', { name: 'Take the tour' })).toBeNull()
  })

  it('leaves the wide composition alone', async () => {
    // No `matchMedia`: jsdom's absence is the wide composition, which is what
    // every other test in this file renders.
    render(<App />)
    await openFixture()
    expect(shownView()).toBeUndefined()
    expect(screen.queryByRole('button', { name: 'Navigation' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Page details' })).toBeNull()
    // Both collapse strips are still there, and both panes are expanded.
    expect(document.querySelectorAll('[aria-controls="folder-rail sidebar-pane"]')).toHaveLength(1)
    expect(document.querySelectorAll('[aria-controls="meta-panel"]')).toHaveLength(1)
  })

  it('ignores a fold left over from a wider window', async () => {
    stubCompact()
    render(<App />)
    await openFixture()
    // Nothing renders a strip on compact, so a fold can only arrive from a
    // wider window; the panes must not carry it into the one-view shell.
    const sidebar = document.getElementById('sidebar-pane') as HTMLElement
    const rail = document.querySelector('.layer-nav > :first-child') as HTMLElement
    expect(sidebar.className).not.toContain(sidebarStyles.collapsed)
    expect(rail.className).not.toContain(railStyles.collapsed)
    expect(shell().className).not.toContain('left-collapsed')
  })
})
