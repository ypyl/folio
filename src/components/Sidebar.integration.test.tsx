import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { createRef, type Ref } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Sidebar, type SidebarHandle, type SidebarRow } from './Sidebar'
import styles from './Sidebar.module.css'
import { dayLabel, monthYearLabel } from './months'
import { assetName, boardName, localDayString } from '../vault/index'

const journal = {
  path: 'journals/2026-09-06.md',
  title: '2026-09-06',
  kind: 'journal' as const,
  content: '',
}

/** Row builders (merge-sidebar-sections): App orders and labels the rows; the
 *  sidebar only renders them, so a test states a row directly. */
const pageRow = (path: string, label = path.replace(/\.md$/, ''), pinned = false): SidebarRow => ({
  kind: 'page',
  path,
  label,
  pinned,
})
const boardRow = (path: string): SidebarRow => ({ kind: 'board', path, label: boardName(path) })
const assetRow = (path: string): SidebarRow => ({ kind: 'asset', path, label: assetName(path) })

const manyPageRows = (count: number): SidebarRow[] =>
  Array.from({ length: count }, (_, i) => pageRow(`p${i}.md`, `p${i}`))

// The section body for a title, so a test can say which list it means.
const section = (title: string) =>
  within((screen.getByText(title) as HTMLElement).closest('details') as HTMLElement)

/** The Files listing's own scroll body: the element it is windowed against. */
const scrollBody = () =>
  (screen.getByText('Files') as HTMLElement)
    .closest('details')!
    .querySelector(`.${styles.scrollBody}`) as HTMLElement

function sidebar(loading: boolean, rows: SidebarRow[] = [pageRow('notes.md', 'notes')]) {
  return render(
    <Sidebar
      rows={rows}
      journalEntries={[journal]}
      onOpenAsset={() => {}}
      activePath={null}
      onSelect={() => {}}
      hasVault={!loading}
      loading={loading}
    />,
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('Sidebar', () => {
  it('renders two sections and the listing rows when loaded', () => {
    sidebar(false)
    screen.getByRole('button', { name: 'notes' })
    const summaries = [...screen.getByRole('complementary').querySelectorAll('summary')].map(
      (s) => s.textContent,
    )
    expect(summaries).toEqual(['Journal', 'Files'])
    expect(within(screen.getByRole('complementary')).getAllByRole('button').length).toBeGreaterThan(
      0,
    )
  })

  it('shows skeleton rows and no page rows while the index builds', () => {
    const { rerender } = sidebar(true)
    // Every skeleton row is decorative and never read as a button/content.
    for (const el of screen.getAllByRole('complementary')) {
      expect(within(el).queryByRole('button', { name: 'notes' })).toBeNull()
      expect(within(el).queryByRole('button', { name: '2026-09-06' })).toBeNull()
    }
    const sections = screen.getAllByRole('group')
    expect(sections.length).toBe(2)
    // Journal mirrors the calendar geometry (month bar + weekday letters + a
    // 6x7 day grid = 43 placeholders); the Files listing shows three
    // text-height rows.
    expect(sections[0].querySelectorAll('.skeleton').length).toBe(43)
    expect(sections[1].querySelectorAll('.skeleton').length).toBe(3)
    // Switching back to loaded content shows the real rows again.
    rerender(
      <Sidebar
        rows={[pageRow('notes.md', 'notes')]}
        journalEntries={[journal]}
        onOpenAsset={() => {}}
        activePath={null}
        onSelect={() => {}}
        hasVault
        loading={false}
      />,
    )
    screen.getByRole('button', { name: 'notes' })
  })
})

describe('Sidebar calendar re-anchor (move-nav-controls-to-status-bar)', () => {
  it('re-anchors the calendar when App bumps the Today tick', () => {
    const today = `journals/${localDayString(new Date())}.md`
    const base = {
      rows: [pageRow('notes.md', 'notes')],
      journalEntries: [journal],
      onOpenAsset: () => {},
      activePath: today,
      onSelect: () => {},
      hasVault: true,
    }
    const { rerender } = render(<Sidebar {...base} />)
    screen.getByText(monthLabel(new Date()))
    // Browse away: view-only movement, since the open day did not change.
    fireEvent.click(screen.getByRole('button', { name: 'Next month' }))
    screen.getByText(monthLabel(shiftMonth(new Date(), 1)))
    // The open day never changed, so only the tick can bring the grid back to
    // the current day's month (move-nav-controls-to-status-bar).
    rerender(<Sidebar {...base} todayTick={1} />)
    screen.getByText(monthLabel(new Date()))
  })

  it('holds no navigation controls in the sidebar', () => {
    render(
      <Sidebar
        rows={[pageRow('notes.md', 'notes')]}
        journalEntries={[journal]}
        onOpenAsset={() => {}}
        activePath={null}
        onSelect={() => {}}
        hasVault
      />,
    )
    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Forward' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Today' })).toBeNull()
  })
})

describe('Sidebar windowed listing (add-history-navigation)', () => {
  // jsdom reports no layout, so the test supplies the geometry a browser would:
  // a viewport height, a scroll position, and the listing's offset inside the
  // container (which stays put while the container scrolls). The frame is stubbed
  // synchronous so a scroll recomputes inside the event.
  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(0)
      return 1
    })
  })

  const rectAt = (top: number) =>
    ({ top, bottom: top, left: 0, right: 0, width: 0, height: 0, x: 0, y: top }) as DOMRect

  const renderWindowed = (
    rows: SidebarRow[],
    activePath: string | null = null,
    { clientHeight = 600, listOffset = 200 } = {},
  ) => {
    render(
      <Sidebar
        rows={rows}
        journalEntries={[]}
        onOpenAsset={() => {}}
        activePath={activePath}
        onSelect={() => {}}
        hasVault
      />,
    )
    const body = scrollBody()
    const list = body.querySelector('ul') as HTMLUListElement
    Object.defineProperty(body, 'clientHeight', { value: clientHeight, configurable: true })
    Object.defineProperty(body, 'scrollTop', { value: 0, writable: true, configurable: true })
    Object.defineProperty(body, 'getBoundingClientRect', {
      value: () => rectAt(0),
      configurable: true,
    })
    Object.defineProperty(list, 'getBoundingClientRect', {
      value: () => rectAt(listOffset - body.scrollTop),
      configurable: true,
    })
    fireEvent.scroll(body) // pick up the stubbed geometry
    return { aside: body, list }
  }

  const scrollTo = (aside: HTMLElement, scrollTop: number) => {
    aside.scrollTop = scrollTop
    fireEvent.scroll(aside)
  }

  const rowTitles = () =>
    section('Files')
      .getAllByRole('button')
      .map((b) => b.textContent)

  it('renders a bounded number of rows however long the listing is', () => {
    renderWindowed(manyPageRows(10_000))
    const titles = rowTitles()
    expect(titles.length).toBeLessThan(50)
    // The listing starts below the Journal band, so its first row is still rendered.
    expect(titles[0]).toBe('p0')
    // The spacers stand in for the rest, so the listing's scroll extent is the
    // whole listing rather than the rendered slice.
    const gaps = section('Files')
      .getAllByRole('presentation', { hidden: true })
      .reduce((sum, el) => sum + Number.parseInt((el as HTMLElement).style.height, 10), 0)
    expect(gaps).toBeGreaterThan(0)
    expect(gaps + titles.length * 35).toBe(10_000 * 35)
  })

  it('renders the rows around a deep scroll position', () => {
    const { aside } = renderWindowed(manyPageRows(10_000))
    scrollTo(aside, 1000 * 35)
    const titles = rowTitles()
    expect(titles).toContain('p1000')
    expect(titles).not.toContain('p0')
  })

  it('reports each row position and the listing size to assistive technology', () => {
    renderWindowed(manyPageRows(1000))
    const rows = section('Files').getAllByRole('button')
    const first = rows[0].closest('li') as HTMLElement
    expect(first.getAttribute('aria-setsize')).toBe('1000')
    expect(first.getAttribute('aria-posinset')).toBe('1')
    const second = rows[1].closest('li') as HTMLElement
    expect(second.getAttribute('aria-posinset')).toBe('2')
  })

  it('renders the open page row even when it is outside the window', () => {
    const rows = manyPageRows(1000)
    renderWindowed(rows, rows[900].path)
    const active = screen.getByRole('button', { name: 'p900' })
    expect(active.getAttribute('aria-current')).toBe('page')
    // And it sits at its real position, not next to the rendered window.
    expect((active.closest('li') as HTMLElement).getAttribute('aria-posinset')).toBe('901')
  })

  it('renders the open board row even when it is outside the window', () => {
    const rows = [...manyPageRows(1000), boardRow('boards/Migration.excalidraw')]
    renderWindowed(rows, 'boards/Migration.excalidraw')
    const active = screen.getByRole('button', { name: 'Migration.excalidraw' })
    expect(active.getAttribute('aria-current')).toBe('page')
    expect((active.closest('li') as HTMLElement).getAttribute('aria-posinset')).toBe('1001')
  })

  it('renders every row when the listing fits the viewport', () => {
    renderWindowed(manyPageRows(5), null, { listOffset: 0 })
    expect(rowTitles()).toEqual(['p0', 'p1', 'p2', 'p3', 'p4'])
    expect(section('Files').queryAllByRole('presentation', { hidden: true })).toHaveLength(0)
  })

  it('follows the order it is given, pinned rows first', () => {
    const rows = manyPageRows(1000)
    // What App hands over after ordering: the pinned page leads the listing.
    const ordered = [pageRow('p900.md', 'p900', true), ...rows.filter((r) => r.path !== 'p900.md')]
    renderWindowed(ordered)
    const titles = rowTitles()
    expect(titles[0]).toBe('p900')
    expect(titles[1]).toBe('p0')
    expect(screen.getByRole('button', { name: 'p900' }).getAttribute('data-pinned')).toBe('true')
  })
})

describe('Sidebar Files listing kinds (merge-sidebar-sections)', () => {
  it('badges board rows with b and asset rows with a, and leaves pages unbadged', () => {
    render(
      <Sidebar
        rows={[
          pageRow('Log.md', 'Log'),
          boardRow('boards/Migration.excalidraw'),
          assetRow('assets/shot.png'),
        ]}
        journalEntries={[]}
        onOpenAsset={() => {}}
        onOpenBoard={() => {}}
        activePath={null}
        onSelect={() => {}}
        hasVault
      />,
    )
    expect(screen.getByRole('button', { name: 'Log' }).querySelector(`.${styles.badge}`)).toBeNull()
    expect(
      screen.getByRole('button', { name: 'Migration.excalidraw' }).querySelector(`.${styles.badge}`)
        ?.textContent,
    ).toBe('b')
    expect(
      screen.getByRole('button', { name: 'shot.png' }).querySelector(`.${styles.badge}`)
        ?.textContent,
    ).toBe('a')
  })

  it('renders rows in the order it is given across all kinds', () => {
    render(
      <Sidebar
        rows={[
          pageRow('Log.md', 'Log'),
          boardRow('boards/Migration.excalidraw'),
          assetRow('assets/shot.png'),
        ]}
        journalEntries={[]}
        onOpenAsset={() => {}}
        onOpenBoard={() => {}}
        activePath={null}
        onSelect={() => {}}
        hasVault
      />,
    )
    expect(
      section('Files')
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(['Log', 'bMigration.excalidraw', 'ashot.png'])
  })
})

describe('Sidebar asset rows (vault-assets)', () => {
  const manyAssets = (count: number): SidebarRow[] =>
    Array.from({ length: count }, (_, i) => assetRow(`assets/a${i}.png`))

  const renderAssets = (
    assets: string[],
    { onOpenAsset = vi.fn(), onSelect = vi.fn(), hasVault = true } = {},
  ) => {
    render(
      <Sidebar
        rows={assets.map(assetRow)}
        journalEntries={[]}
        onOpenAsset={onOpenAsset}
        activePath={null}
        onSelect={onSelect}
        hasVault={hasVault}
      />,
    )
    return { onOpenAsset, onSelect }
  }

  it('labels a row by its path inside assets/', () => {
    renderAssets(['assets/shot.png', 'assets/2026/q3.pdf'])
    expect(section('Files').getByRole('button', { name: 'shot.png' })).toBeTruthy()
    expect(section('Files').getByRole('button', { name: '2026/q3.pdf' })).toBeTruthy()
  })

  it('opens the file when its row is activated, without navigating', () => {
    const { onOpenAsset, onSelect } = renderAssets(['assets/q3-report.pdf'])
    fireEvent.click(screen.getByRole('button', { name: 'q3-report.pdf' }))
    expect(onOpenAsset).toHaveBeenCalledWith('assets/q3-report.pdf')
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('marks no asset row as the open page', () => {
    renderAssets(['assets/shot.png'])
    const row = screen.getByRole('button', { name: 'shot.png' })
    expect(row.getAttribute('aria-current')).toBeNull()
    expect(row.getAttribute('data-active')).toBeNull()
  })

  it('shows empty-state copy only when the whole listing is empty', () => {
    renderAssets([])
    expect(section('Files').getByText('No notes yet.')).toBeTruthy()
  })

  it('shows no copy when the vault holds pages but no files', () => {
    render(
      <Sidebar
        rows={[pageRow('Log.md', 'Log')]}
        journalEntries={[]}
        onOpenAsset={() => {}}
        activePath={null}
        onSelect={() => {}}
        hasVault
      />,
    )
    expect(section('Files').queryByText('No notes yet.')).toBeNull()
  })

  it('renders no copy or rows while no vault is open', () => {
    renderAssets([], { hasVault: false })
    expect(section('Files').queryByText('No notes yet.')).toBeNull()
    expect(section('Files').queryAllByRole('button')).toHaveLength(0)
  })

  it('renders a bounded number of rows however many files the vault holds', () => {
    renderAssets(manyAssets(10_000).map((r) => r.path))
    const rows = section('Files').getAllByRole('button')
    expect(rows.length).toBeLessThan(50)
    // The spacers stand in for the rest, so the listing's scroll extent is the
    // whole listing rather than the rendered slice.
    const gaps = section('Files')
      .getAllByRole('presentation', { hidden: true })
      .reduce((sum, el) => sum + Number.parseInt((el as HTMLElement).style.height, 10), 0)
    expect(gaps).toBeGreaterThan(0)
    expect(gaps + rows.length * 35).toBe(10_000 * 35)
  })

  it('reports each asset row position and the listing size', () => {
    renderAssets(manyAssets(1000).map((r) => r.path))
    const rows = section('Files').getAllByRole('button')
    const first = rows[0].closest('li') as HTMLElement
    expect(first.getAttribute('aria-setsize')).toBe('1000')
    expect(first.getAttribute('aria-posinset')).toBe('1')
  })
})

describe('Sidebar pinned rows (add-pinned-pages)', () => {
  const renderRows = (rows: SidebarRow[], onSelect = vi.fn()) =>
    render(
      <Sidebar
        rows={rows}
        journalEntries={[]}
        onOpenAsset={() => {}}
        activePath={null}
        onSelect={onSelect}
        hasVault
      />,
    )

  it('a pinned row shows the pinned style and data-pinned; unpinned rows show neither', () => {
    renderRows([pageRow('a.md', 'a', true), pageRow('b.md', 'b')])
    const a = screen.getByRole('button', { name: 'a' })
    const b = screen.getByRole('button', { name: 'b' })
    expect(a.getAttribute('data-pinned')).toBe('true')
    expect(a.className).toContain('rowPinned')
    expect(a.querySelector('svg')).toBeNull() // no icon on the row
    expect(b.getAttribute('data-pinned')).toBeNull()
    expect(b.className).not.toContain('rowPinned')
  })

  it('a page row is a single navigable button — no star control on the row', () => {
    renderRows([pageRow('notes.md', 'notes', true)])
    expect(screen.queryByRole('button', { name: /pin notes/i })).toBeNull()
    const row = screen.getByRole('button', { name: 'notes' })
    expect(row.getAttribute('data-pinned')).toBe('true')
    expect(within(row).queryByRole('button')).toBeNull()
    expect(row.querySelector('svg')).toBeNull()
  })

  it('clicking the row navigates', () => {
    const onSelect = vi.fn()
    renderRows([pageRow('notes.md', 'notes')], onSelect)
    fireEvent.click(screen.getByRole('button', { name: 'notes' }))
    expect(onSelect).toHaveBeenCalledWith('notes.md')
  })

  it('renders rows in the given order, marking only the pinned ones', () => {
    renderRows([pageRow('a.md', 'a', true), pageRow('b.md', 'b')])
    expect(screen.getAllByRole('button', { name: /^(a|b)$/ }).map((b) => b.textContent)).toEqual([
      'a',
      'b',
    ])
  })
})

const monthLabel = (date: Date) => monthYearLabel(date.getFullYear(), date.getMonth())
const shiftMonth = (date: Date, months: number) =>
  new Date(date.getFullYear(), date.getMonth() + months, 1)

// drag-references-into-editor: a sidebar row is a drag source carrying what the
// row names — a vault path, or a page name — never the Markdown it becomes.
describe('Sidebar drag sources (drag-references-into-editor)', () => {
  function dragTransfer(): DataTransfer {
    const store = new Map<string, string>()
    return {
      get types() {
        return [...store.keys()]
      },
      getData: (type: string) => store.get(type) ?? '',
      setData: (type: string, value: string) => void store.set(type, value),
      effectAllowed: 'none',
    } as unknown as DataTransfer
  }

  const renderMixed = (rows: SidebarRow[], onOpenAsset = vi.fn(), onSelect = vi.fn()) =>
    render(
      <Sidebar
        rows={rows}
        journalEntries={[]}
        onOpenAsset={onOpenAsset}
        activePath={null}
        onSelect={onSelect}
        hasVault
      />,
    )

  it('carries the file path an asset row names, not its label', () => {
    renderMixed([assetRow('assets/2026/q3-report.pdf')])
    const dt = dragTransfer()
    fireEvent.dragStart(section('Files').getByRole('button', { name: '2026/q3-report.pdf' }), {
      dataTransfer: dt,
    })
    expect(dt.getData('application/x-folio-asset')).toBe('assets/2026/q3-report.pdf')
    expect(dt.effectAllowed).toBe('copy')
  })

  it('carries the page name a page row names', () => {
    renderMixed([pageRow('reading list.md', 'reading list')])
    const dt = dragTransfer()
    fireEvent.dragStart(section('Files').getByRole('button', { name: 'reading list' }), {
      dataTransfer: dt,
    })
    expect(dt.getData('application/x-folio-page')).toBe('reading list')
  })

  // The same predicate that keeps such a name out of the completion pool: a
  // token would read back as a different page, which is a silent wrong answer.
  it('is not a drag source when no reference token can express the name', () => {
    renderMixed([pageRow('weird]name.md', 'weird]name')])
    const row = section('Files').getByRole('button', { name: 'weird]name' })
    const dt = dragTransfer()
    fireEvent.dragStart(row, { dataTransfer: dt })
    expect(dt.types).toEqual([])
    expect(row.getAttribute('draggable')).toBe('false')
  })

  it('leaves the click alone: a row that does not move still opens', () => {
    const onOpenAsset = vi.fn()
    const onSelect = vi.fn()
    renderMixed([pageRow('notes.md', 'notes'), assetRow('assets/shot.png')], onOpenAsset, onSelect)
    fireEvent.click(section('Files').getByRole('button', { name: 'shot.png' }))
    fireEvent.click(section('Files').getByRole('button', { name: 'notes' }))
    expect(onOpenAsset).toHaveBeenCalledWith('assets/shot.png')
    expect(onSelect).toHaveBeenCalledWith('notes.md')
  })
})

describe('Sidebar boards (add-whiteboards)', () => {
  it('lists boards in the Files listing and opens one on click', () => {
    const onOpenBoard = vi.fn()
    render(
      <Sidebar
        rows={[
          pageRow('notes.md', 'notes'),
          boardRow('boards/2026/q3.excalidraw'),
          boardRow('boards/Migration.excalidraw'),
        ]}
        journalEntries={[journal]}
        onOpenAsset={() => {}}
        onOpenBoard={onOpenBoard}
        activePath={null}
        onSelect={() => {}}
        hasVault
      />,
    )
    const boardButtons = section('Files')
      .getAllByRole('button')
      .filter((b) => b.querySelector(`.${styles.badge}`)?.textContent === 'b')
    expect(boardButtons.map((b) => b.textContent)).toEqual([
      'b2026/q3.excalidraw',
      'bMigration.excalidraw',
    ])
    fireEvent.click(screen.getByRole('button', { name: 'Migration.excalidraw' }))
    expect(onOpenBoard).toHaveBeenCalledWith('boards/Migration.excalidraw')
  })

  it('marks the open board as the active row', () => {
    render(
      <Sidebar
        rows={[pageRow('notes.md', 'notes'), boardRow('boards/Migration.excalidraw')]}
        journalEntries={[journal]}
        onOpenAsset={() => {}}
        onOpenBoard={() => {}}
        activePath="boards/Migration.excalidraw"
        onSelect={() => {}}
        hasVault
      />,
    )
    const row = screen.getByRole('button', { name: 'Migration.excalidraw' })
    expect(row.getAttribute('aria-current')).toBe('page')
  })

  it('shows no board rows when the vault holds none', () => {
    render(
      <Sidebar
        rows={[pageRow('notes.md', 'notes')]}
        journalEntries={[journal]}
        onOpenAsset={() => {}}
        onOpenBoard={() => {}}
        activePath={null}
        onSelect={() => {}}
        hasVault
      />,
    )
    expect(section('Files').queryByText('No boards yet.')).toBeNull()
    expect(section('Files').getAllByRole('button')).toHaveLength(1)
  })
})

// The page-row context menu (add-row-context-menu, row-context-menu spec):
// only page rows open it, and its two items act on that row's page.
describe('page-row context menu (add-row-context-menu)', () => {
  const rows = [
    pageRow('a.md', 'Alpha'),
    boardRow('boards/Diagram.excalidraw'),
    assetRow('assets/pic.png'),
  ]

  const list = (extra: Partial<Parameters<typeof Sidebar>[0]> = {}) =>
    render(
      <Sidebar
        rows={rows}
        journalEntries={[journal]}
        onOpenAsset={() => {}}
        onOpenBoard={() => {}}
        activePath={null}
        onSelect={() => {}}
        hasVault
        {...extra}
      />,
    )

  const rightClick = (name: string) =>
    fireEvent.contextMenu(screen.getByRole('button', { name }), { clientX: 40, clientY: 40 })

  it('opens on a page row with Favorite, and no Present row', () => {
    list()
    rightClick('Alpha')
    screen.getByRole('menu')
    // Presenting is disabled for now (swap-editor-to-codemirror-live-preview).
    expect(screen.getAllByRole('menuitem').map((b) => b.textContent)).toEqual(['Favorite'])
  })

  it('advertises the menu only on page rows', () => {
    list()
    expect(screen.getByRole('button', { name: 'Alpha' }).getAttribute('aria-haspopup')).toBe('menu')
    expect(
      screen
        .getByRole('button', { name: boardName('boards/Diagram.excalidraw') })
        .getAttribute('aria-haspopup'),
    ).toBeNull()
    expect(
      screen
        .getByRole('button', { name: assetName('assets/pic.png') })
        .getAttribute('aria-haspopup'),
    ).toBeNull()
  })

  it('does not open on a board row, an asset row, or a journal day', () => {
    list()
    rightClick(boardName('boards/Diagram.excalidraw'))
    expect(screen.queryByRole('menu')).toBeNull()
    rightClick(assetName('assets/pic.png'))
    expect(screen.queryByRole('menu')).toBeNull()
    fireEvent.contextMenu(screen.getByRole('button', { name: dayLabel(new Date()) }), {
      clientX: 1,
      clientY: 1,
    })
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('activates the actions with the row path and reflects the favorite state', () => {
    const onFavorite = vi.fn()
    const onPresent = vi.fn()
    const { rerender } = list({ onFavorite, onPresent })

    rightClick('Alpha')
    fireEvent.click(screen.getByRole('menuitem', { name: 'Favorite' }))
    expect(onFavorite).toHaveBeenCalledWith('a.md')

    // A replacement rows array carrying the favorited flag flips the label.
    rerender(
      <Sidebar
        rows={[pageRow('a.md', 'Alpha', true), boardRow('boards/Diagram.excalidraw')]}
        journalEntries={[journal]}
        onOpenAsset={() => {}}
        onOpenBoard={() => {}}
        activePath={null}
        onSelect={() => {}}
        hasVault
        onFavorite={onFavorite}
        onPresent={onPresent}
      />,
    )
    rightClick('Alpha')
    screen.getByRole('menuitem', { name: 'Unfavorite' })
  })

  // remove-reminder-from-the-page-row: the reminder item sits between the
  // favorite item and Present, and only a page that holds a rule gets it. It
  // names the schedule it would delete (name-the-schedule-in-remove-reminder).
  const rules = (
    entries: [
      string,
      { recurrence: 'once' | 'daily' | 'weekly' | 'monthly' | 'yearly'; anchor: string },
    ][],
  ) => new Map(entries)

  it('offers a labelled Remove reminder for a page that holds a rule', () => {
    const onRemoveReminderFor = vi.fn()
    list({
      remindersEnabled: true,
      reminderRules: rules([['alpha', { recurrence: 'daily', anchor: '2026-10-06' }]]),
      onRemoveReminderFor,
    })

    rightClick('Alpha')
    // The action's name is the label; the schedule is a caption beneath it and
    // the item's accessible description (show-the-schedule-under-remove-reminder).
    const item = screen.getByRole('menuitem', { name: 'Remove reminder' })
    expect(within(item).getByText('every day from October 6, 2026')).toBeTruthy()
    expect(item.getAttribute('aria-describedby')).toBe(
      within(item).getByText('every day from October 6, 2026').id,
    )
    expect(screen.getAllByRole('menuitem').map((b) => b.textContent)).toEqual([
      'Favorite',
      'Remove reminderevery day from October 6, 2026',
    ])
    fireEvent.click(item)
    expect(onRemoveReminderFor).toHaveBeenCalledWith('a.md')
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('names a one-off reminder by its day', () => {
    list({
      remindersEnabled: true,
      reminderRules: rules([['alpha', { recurrence: 'once', anchor: '2026-10-20' }]]),
      onRemoveReminderFor: vi.fn(),
    })
    rightClick('Alpha')
    const item = screen.getByRole('menuitem', { name: 'Remove reminder' })
    expect(within(item).getByText('once, on October 20, 2026')).toBeTruthy()
  })

  it('offers no Remove reminder for a page without a rule', () => {
    list({
      remindersEnabled: true,
      reminderRules: rules([['somebody-else', { recurrence: 'daily', anchor: '2026-10-06' }]]),
      onRemoveReminderFor: vi.fn(),
    })
    rightClick('Alpha')
    expect(screen.queryByRole('menuitem', { name: /^Remove reminder/ })).toBeNull()
  })

  it('offers no Remove reminder while the reminders feature is off', () => {
    list({
      remindersEnabled: false,
      reminderRules: rules([['alpha', { recurrence: 'daily', anchor: '2026-10-06' }]]),
      onRemoveReminderFor: vi.fn(),
    })
    rightClick('Alpha')
    expect(screen.queryByRole('menuitem', { name: /^Remove reminder/ })).toBeNull()
  })

  it('does not open a page when removing its reminder', () => {
    const onSelect = vi.fn()
    list({
      remindersEnabled: true,
      reminderRules: rules([['alpha', { recurrence: 'daily', anchor: '2026-10-06' }]]),
      onSelect,
    })
    rightClick('Alpha')
    fireEvent.click(screen.getByRole('menuitem', { name: /^Remove reminder/ }))
    expect(onSelect).not.toHaveBeenCalled()
  })
})

// Revealing the open page's row (reveal-open-page-in-files, the status-bar
// reveal requirement): the sidebar exposes one imperative call that App makes
// from the status bar. It opens the Files section, scrolls the row into view,
// and focuses it — and does nothing when there is nothing to reveal.
describe('Sidebar reveal (reveal-open-page-in-files)', () => {
  const scrollIntoView = vi.fn()

  // jsdom ships no scrollIntoView, so the test defines the seam that the
  // browser provides; focus works in both.
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

  const filesSection = () =>
    (screen.getByText('Files') as HTMLElement).closest('details') as HTMLDetailsElement

  const list = (rows: SidebarRow[], activePath: string | null, ref: Ref<SidebarHandle>) =>
    render(
      <Sidebar
        ref={ref}
        rows={rows}
        journalEntries={[journal]}
        onOpenAsset={() => {}}
        activePath={activePath}
        onSelect={() => {}}
        hasVault
      />,
    )

  it('opens the Files section, scrolls the active row into view, and focuses it', () => {
    const ref = createRef<SidebarHandle>()
    list(manyPageRows(60), 'p49.md', ref)
    const files = filesSection()
    files.open = false

    ref.current!.revealActive()

    expect(files.open).toBe(true)
    const row = screen.getByRole('button', { name: 'p49' })
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' })
    expect(document.activeElement).toBe(row)
  })

  it('does nothing when there is no listing or no active row', () => {
    const ref = createRef<SidebarHandle>()
    const { rerender } = list([], null, ref)
    expect(() => ref.current!.revealActive()).not.toThrow()

    rerender(
      <Sidebar
        ref={ref}
        rows={[pageRow('a.md', 'Alpha')]}
        journalEntries={[journal]}
        onOpenAsset={() => {}}
        activePath={null}
        onSelect={() => {}}
        hasVault
      />,
    )
    expect(() => ref.current!.revealActive()).not.toThrow()
    expect(scrollIntoView).not.toHaveBeenCalled()
    expect(document.activeElement).not.toBe(screen.getByRole('button', { name: 'Alpha' }))
  })
})

// Locating a day in the calendar (focus-the-journal-day-in-the-calendar): the
// sidebar opens the Journal section and hands the day to the calendar, which
// does the re-anchor and the focus. A closed section renders nothing focusable,
// so the open has to land before the request does.
describe('Sidebar day locate (focus-the-journal-day-in-the-calendar)', () => {
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

  const today = () => localDayString(new Date())
  const todayPath = () => `journals/${today()}.md`
  const todayCell = () => screen.getByRole('button', { name: dayLabel(new Date()) })
  const journalSection = () =>
    (screen.getByText('Journal') as HTMLElement).closest('details') as HTMLDetailsElement
  const calendar = (ref: Ref<SidebarHandle>) =>
    render(
      <Sidebar
        ref={ref}
        rows={[pageRow('pages/Alpha.md', 'Alpha')]}
        journalEntries={[journal]}
        onOpenAsset={() => {}}
        activePath={todayPath()}
        onSelect={() => {}}
        hasVault
      />,
    )

  it('opens a collapsed Journal section and focuses the day', () => {
    const ref = createRef<SidebarHandle>()
    calendar(ref)
    journalSection().open = false

    // The locate is an imperative call that updates the pane's state, so it runs
    // inside act, the way App's click runs inside a React event.
    act(() => ref.current!.locateDay(today()))

    expect(journalSection().open).toBe(true)
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' })
    expect(document.activeElement).toBe(todayCell())
  })

  it('focuses the same day again when it is located twice', () => {
    const ref = createRef<SidebarHandle>()
    calendar(ref)
    act(() => ref.current!.locateDay(today()))
    const away = screen.getByRole('button', { name: 'Next month' })
    away.focus()

    act(() => ref.current!.locateDay(today()))

    expect(document.activeElement).toBe(todayCell())
  })
})

describe('Sidebar day menu (add-reminders)', () => {
  const dayCell = () => screen.getByRole('button', { name: dayLabel(new Date(2026, 8, 6)) })

  it('offers the recurrence items and calls onRemind with the day', () => {
    const onRemind = vi.fn()
    render(
      <Sidebar
        rows={[pageRow('pages/Ana.md', 'Ana')]}
        journalEntries={[journal]}
        onOpenAsset={() => {}}
        activePath={journal.path}
        onSelect={() => {}}
        hasVault
        reminderTarget="Ana"
        remindersEnabled
        today="2026-09-06"
        onRemind={onRemind}
      />,
    )
    fireEvent.contextMenu(dayCell())
    screen.getByRole('menu')
    expect(within(screen.getByRole('menu')).getByRole('group', { name: 'Reminder' })).toBeTruthy()
    // The day menu chooses a recurrence and nothing else: removal lives on the
    // page's row menu (confirm-replacing-a-reminder).
    expect(
      within(screen.getByRole('menu'))
        .getAllByRole('menuitem')
        .map((b) => b.textContent),
    ).toEqual(['Once, on this day', 'Every day', 'Every week', 'Every month', 'Every year'])
    fireEvent.click(screen.getByRole('menuitem', { name: 'Every year' }))
    expect(onRemind).toHaveBeenCalledWith('2026-09-06', 'yearly')
  })

  it('offers the recurrences on a past day with only Once unavailable', () => {
    const onRemind = vi.fn()
    render(
      <Sidebar
        rows={[pageRow('pages/Ana.md', 'Ana')]}
        journalEntries={[journal]}
        onOpenAsset={() => {}}
        activePath={journal.path}
        onSelect={() => {}}
        hasVault
        reminderTarget="Ana"
        remindersEnabled
        today="2026-09-15"
        onRemind={onRemind}
      />,
    )

    // The 6th is past: the menu opens, and only the once item is unavailable.
    fireEvent.contextMenu(dayCell())
    screen.getByRole('menu')
    const once = screen.getByRole('menuitem', { name: 'Once, on this day' }) as HTMLButtonElement
    expect(once.disabled).toBe(true)
    for (const name of ['Every day', 'Every week', 'Every month', 'Every year']) {
      const item = screen.getByRole('menuitem', { name }) as HTMLButtonElement
      expect(item.disabled).toBe(false)
    }

    // A recurrence still anchors on the past day.
    fireEvent.click(screen.getByRole('menuitem', { name: 'Every week' }))
    expect(onRemind).toHaveBeenCalledWith('2026-09-06', 'weekly')
  })

  it('offers no day menu when no page is open to remind about', () => {
    render(
      <Sidebar
        rows={[pageRow('pages/Ana.md', 'Ana')]}
        journalEntries={[journal]}
        onOpenAsset={() => {}}
        activePath={journal.path}
        onSelect={() => {}}
        hasVault
        remindersEnabled
        reminderTarget={null}
      />,
    )
    fireEvent.contextMenu(dayCell())
    expect(screen.queryByRole('menu')).toBeNull()
  })
})

describe('Sidebar day menu feature gate (add-prerelease-mode)', () => {
  it('offers no day menu while the reminders gate is off', () => {
    render(
      <Sidebar
        rows={[pageRow('pages/Ana.md', 'Ana')]}
        journalEntries={[journal]}
        onOpenAsset={() => {}}
        activePath={journal.path}
        onSelect={() => {}}
        hasVault
        reminderTarget="Ana"
        remindersEnabled={false}
        onRemind={vi.fn()}
      />,
    )
    fireEvent.contextMenu(screen.getByRole('button', { name: dayLabel(new Date(2026, 8, 6)) }))
    expect(screen.queryByRole('menu')).toBeNull()
  })
})

// disable-once-for-past-days: the past costs the menu only its once item.
describe('Sidebar day menu on a past day (disable-once-for-past-days)', () => {
  const pastCell = () => screen.getByRole('button', { name: dayLabel(new Date(2026, 8, 6)) })

  it('keeps Once available on today', () => {
    render(
      <Sidebar
        rows={[pageRow('pages/Ana.md', 'Ana')]}
        journalEntries={[journal]}
        onOpenAsset={() => {}}
        activePath={journal.path}
        onSelect={() => {}}
        hasVault
        reminderTarget="Ana"
        remindersEnabled
        today="2026-09-06"
        onRemind={vi.fn()}
      />,
    )
    fireEvent.contextMenu(pastCell())
    const once = screen.getByRole('menuitem', { name: 'Once, on this day' }) as HTMLButtonElement
    expect(once.disabled).toBe(false)
  })
})
