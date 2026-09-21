import { fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Sidebar } from './Sidebar'
import styles from './Sidebar.module.css'
import { monthYearLabel } from './months'
import { localDayString } from '../vault/index'
import type { Page } from '../page'

const journal = {
  path: 'journals/2026-09-06.md',
  title: '2026-09-06',
  kind: 'journal' as const,
  content: '',
}
const page = { path: 'notes.md', title: 'notes', kind: 'page' as const, content: '' }

const manyPages = (count: number): Page[] =>
  Array.from({ length: count }, (_, i) => ({
    path: `p${i}.md`,
    title: `p${i}`,
    kind: 'page' as const,
    content: '',
  }))

// The section body for a title, so a test can say which list it means.
const section = (title: string) =>
  within((screen.getByText(title) as HTMLElement).closest('details') as HTMLElement)

/** A section's own scroll body (add-asset-navigation): the element its listing
 *  is windowed against, since the sections share the pane. */
const scrollBody = (title: string) =>
  (screen.getByText(title) as HTMLElement)
    .closest('details')!
    .querySelector(`.${styles.scrollBody}`) as HTMLElement

function sidebar(loading: boolean) {
  return render(
    <Sidebar
      pages={[page]}
      journalEntries={[journal]}
      assets={[]}
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
  it('renders sections and page rows when loaded', () => {
    sidebar(false)
    expect(screen.getByRole('button', { name: 'notes' })).toBeTruthy()
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
    expect(sections.length).toBe(4)
    // Journal mirrors the calendar geometry (month bar + weekday letters + a
    // 6x7 day grid = 43 placeholders); Pages and Assets each show three
    // text-height rows.
    expect(sections[0].querySelectorAll('.skeleton').length).toBe(43)
    expect(sections[1].querySelectorAll('.skeleton').length).toBe(3)
    expect(sections[2].querySelectorAll('.skeleton').length).toBe(3)
    // Switching back to loaded content shows the real rows again.
    rerender(
      <Sidebar
        pages={[page]}
        journalEntries={[journal]}
        assets={[]}
        onOpenAsset={() => {}}
        activePath={null}
        onSelect={() => {}}
        hasVault
        loading={false}
      />,
    )
    expect(screen.getByRole('button', { name: 'notes' })).toBeTruthy()
  })
})

describe('Sidebar navigation controls (add-history-navigation)', () => {
  const renderControls = (
    canBack: boolean,
    canForward: boolean,
    onBack = vi.fn(),
    onForward = vi.fn(),
  ) => {
    render(
      <Sidebar
        pages={[page]}
        journalEntries={[journal]}
        assets={[]}
        onOpenAsset={() => {}}
        activePath={null}
        onSelect={() => {}}
        hasVault
        canBack={canBack}
        canForward={canForward}
        onBack={onBack}
        onForward={onForward}
      />,
    )
    return { onBack, onForward }
  }

  it('leads the sidebar, above the sections, as one sticky row', () => {
    renderControls(false, false)
    const aside = screen.getByRole('complementary')
    const controls = aside.firstElementChild as HTMLElement
    expect(controls.className).toContain(styles.controls)
    // Back and Forward (the trail), then Today (move-today-into-nav-controls),
    // all in the row's own control treatment.
    const row = [...controls.querySelectorAll('button')]
    expect(row).toHaveLength(3)
    expect(row.map((b) => b.getAttribute('aria-label') ?? b.textContent)).toEqual([
      'Back',
      'Forward',
      'Today',
    ])
    expect(row[2].className).toContain(styles.control)
    // The row precedes the sections, and the Journal section still leads them.
    const next = controls.nextElementSibling as HTMLElement
    expect(next.tagName).toBe('DETAILS')
    expect(next.querySelector('summary')?.textContent).toBe('Journal')
    // The sidebar holds no History section any more.
    expect(screen.queryByText('History')).toBeNull()
  })

  it('names each control for assistive technology', () => {
    renderControls(true, true)
    expect(screen.getByRole('button', { name: 'Back' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Forward' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Today' })).toBeTruthy()
  })

  it('disables a control with nowhere to step', () => {
    renderControls(false, true)
    expect((screen.getByRole('button', { name: 'Back' }) as HTMLButtonElement).disabled).toBe(true)
    expect((screen.getByRole('button', { name: 'Forward' }) as HTMLButtonElement).disabled).toBe(
      false,
    )
  })

  it('calls the handler for the direction it represents', () => {
    const { onBack, onForward } = renderControls(true, true)
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(onBack).toHaveBeenCalledTimes(1)
    expect(onForward).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Forward' }))
    expect(onForward).toHaveBeenCalledTimes(1)
  })

  it('renders Today in the row, disabled while no vault is usable', () => {
    render(
      <Sidebar
        pages={[page]}
        journalEntries={[journal]}
        assets={[]}
        onOpenAsset={() => {}}
        activePath={null}
        onSelect={() => {}}
        hasVault={false}
      />,
    )
    expect((screen.getByRole('button', { name: 'Today' }) as HTMLButtonElement).disabled).toBe(true)
  })

  it('Today calls its handler and re-anchors the calendar to the current day', () => {
    const onToday = vi.fn()
    const today = `journals/${localDayString(new Date())}.md`
    render(
      <Sidebar
        pages={[page]}
        journalEntries={[journal]}
        assets={[]}
        onOpenAsset={() => {}}
        activePath={today}
        onSelect={() => {}}
        hasVault
        onToday={onToday}
      />,
    )
    expect(screen.getByText(monthLabel(new Date()))).toBeTruthy()
    // Browse away: view-only movement, since the open day did not change.
    fireEvent.click(screen.getByRole('button', { name: 'Next month' }))
    expect(screen.getByText(monthLabel(shiftMonth(new Date(), 1)))).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Today' }))
    expect(onToday).toHaveBeenCalledTimes(1)
    // The open day never changed, so only the row's tick can bring the grid
    // back to the current day's month (move-today-into-nav-controls, D3).
    expect(screen.getByText(monthLabel(new Date()))).toBeTruthy()
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
    pages: Page[],
    activePath: string | null = null,
    { clientHeight = 600, listOffset = 200, pinnedPaths = [] as string[] } = {},
    assets: string[] = [],
  ) => {
    render(
      <Sidebar
        pages={pages}
        journalEntries={[]}
        assets={assets}
        onOpenAsset={() => {}}
        activePath={activePath}
        onSelect={() => {}}
        pinnedPaths={pinnedPaths}
        hasVault
      />,
    )
    const body = scrollBody('Pages')
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
    section('Pages')
      .getAllByRole('button')
      .map((b) => b.textContent)

  it('renders a bounded number of rows however long the listing is', () => {
    renderWindowed(manyPages(10_000))
    const titles = rowTitles()
    expect(titles.length).toBeLessThan(50)
    // The listing starts below the sections, so its first row is still rendered.
    expect(titles[0]).toBe('p0')
    // The spacers stand in for the rest, so the listing's scroll extent is the
    // whole listing rather than the rendered slice.
    const gaps = section('Pages')
      .getAllByRole('presentation', { hidden: true })
      .reduce((sum, el) => sum + Number.parseInt((el as HTMLElement).style.height, 10), 0)
    expect(gaps).toBeGreaterThan(0)
    expect(gaps + titles.length * 35).toBe(10_000 * 35)
  })

  it('renders the rows around a deep scroll position', () => {
    const { aside } = renderWindowed(manyPages(10_000))
    scrollTo(aside, 1000 * 35)
    const titles = rowTitles()
    expect(titles).toContain('p1000')
    expect(titles).not.toContain('p0')
  })

  it('reports each row position and the listing size to assistive technology', () => {
    renderWindowed(manyPages(1000))
    const rows = section('Pages').getAllByRole('button')
    const first = rows[0].closest('li') as HTMLElement
    expect(first.getAttribute('aria-setsize')).toBe('1000')
    expect(first.getAttribute('aria-posinset')).toBe('1')
    const second = rows[1].closest('li') as HTMLElement
    expect(second.getAttribute('aria-posinset')).toBe('2')
  })

  it('renders the open page row even when it is outside the window', () => {
    const pages = manyPages(1000)
    renderWindowed(pages, pages[900].path)
    const active = screen.getByRole('button', { name: 'p900' })
    expect(active.getAttribute('aria-current')).toBe('page')
    // And it sits at its real position, not next to the rendered window.
    expect((active.closest('li') as HTMLElement).getAttribute('aria-posinset')).toBe('901')
  })

  it('renders every row when the listing fits the viewport', () => {
    renderWindowed(manyPages(5), null, { listOffset: 0 })
    expect(rowTitles()).toEqual(['p0', 'p1', 'p2', 'p3', 'p4'])
    expect(section('Pages').queryAllByRole('presentation', { hidden: true })).toHaveLength(0)
  })

  it('follows the order it is given, pinned rows first', () => {
    const pages = manyPages(1000)
    // What App hands over after orderPages: the pinned page leads the listing.
    const ordered = [pages[900], ...pages.filter((p) => p.path !== pages[900].path)]
    renderWindowed(ordered, null, { pinnedPaths: [pages[900].path] })
    const titles = rowTitles()
    expect(titles[0]).toBe('p900')
    expect(titles[1]).toBe('p0')
    expect(screen.getByRole('button', { name: 'p900' }).getAttribute('data-pinned')).toBe('true')
  })
})

describe('Sidebar assets (vault-assets)', () => {
  const manyAssets = (count: number): string[] =>
    Array.from({ length: count }, (_, i) => `assets/a${i}.png`)

  const renderAssets = (
    assets: string[],
    { onOpenAsset = vi.fn(), onSelect = vi.fn(), hasVault = true } = {},
  ) => {
    render(
      <Sidebar
        pages={[]}
        journalEntries={[]}
        assets={assets}
        onOpenAsset={onOpenAsset}
        activePath={null}
        onSelect={onSelect}
        hasVault={hasVault}
      />,
    )
    return { onOpenAsset, onSelect }
  }

  it('renders all four summaries, with Boards and Assets last and collapsed', () => {
    renderAssets(['assets/shot.png'])
    const details = [...screen.getByRole('complementary').querySelectorAll('details')]
    expect(details.map((d) => d.querySelector('summary')?.textContent)).toEqual([
      'Journal',
      'Pages',
      'Boards',
      'Assets',
    ])
    expect(details[0].hasAttribute('open')).toBe(true)
    expect(details[1].hasAttribute('open')).toBe(true)
    expect(details[2].hasAttribute('open')).toBe(false)
    expect(details[3].hasAttribute('open')).toBe(false)
  })

  it('keeps the controls and every summary outside the scrolling bodies', () => {
    renderAssets(['assets/a.png'])
    const aside = screen.getByRole('complementary')
    for (const title of ['Journal', 'Pages', 'Boards', 'Assets']) {
      expect((screen.getByText(title) as HTMLElement).closest(`.${styles.scrollBody}`)).toBeNull()
    }
    const controls = aside.firstElementChild as HTMLElement
    expect(controls.className).toContain(styles.controls)
    expect(controls.closest(`.${styles.scrollBody}`)).toBeNull()
  })

  it('gives each listing its own scroll body', () => {
    renderAssets(['assets/a.png'])
    const pages = scrollBody('Pages')
    const assets = scrollBody('Assets')
    expect(pages).not.toBe(assets)
    expect(pages.className).toContain(styles.scrollBody)
    expect(assets.className).toContain(styles.scrollBody)
  })

  it('labels a row by its path inside assets/', () => {
    renderAssets(['assets/shot.png', 'assets/2026/q3.pdf'])
    expect(section('Assets').getByRole('button', { name: 'shot.png' })).toBeTruthy()
    expect(section('Assets').getByRole('button', { name: '2026/q3.pdf' })).toBeTruthy()
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

  it('shows empty-state copy for a vault with no assets', () => {
    renderAssets([])
    expect(section('Assets').getByText('No assets yet.')).toBeTruthy()
  })

  it('renders no copy or rows while no vault is open', () => {
    renderAssets([], { hasVault: false })
    expect(section('Assets').queryByText('No assets yet.')).toBeNull()
    expect(section('Assets').queryAllByRole('button')).toHaveLength(0)
  })

  it('renders a bounded number of rows however many assets the vault holds', () => {
    renderAssets(manyAssets(10_000))
    const rows = section('Assets').getAllByRole('button')
    expect(rows.length).toBeLessThan(50)
    // The spacers stand in for the rest, so the listing's scroll extent is the
    // whole listing rather than the rendered slice.
    const gaps = section('Assets')
      .getAllByRole('presentation', { hidden: true })
      .reduce((sum, el) => sum + Number.parseInt((el as HTMLElement).style.height, 10), 0)
    expect(gaps).toBeGreaterThan(0)
    expect(gaps + rows.length * 35).toBe(10_000 * 35)
  })

  it('reports each asset row position and the listing size', () => {
    renderAssets(manyAssets(1000))
    const rows = section('Assets').getAllByRole('button')
    const first = rows[0].closest('li') as HTMLElement
    expect(first.getAttribute('aria-setsize')).toBe('1000')
    expect(first.getAttribute('aria-posinset')).toBe('1')
  })
})

describe('Sidebar pinned rows (add-pinned-pages)', () => {
  const renderRows = (pages: (typeof page)[], pinnedPaths: string[], onSelect = vi.fn()) =>
    render(
      <Sidebar
        pages={pages}
        journalEntries={[]}
        assets={[]}
        onOpenAsset={() => {}}
        activePath={null}
        onSelect={onSelect}
        pinnedPaths={pinnedPaths}
        hasVault
      />,
    )

  it('a pinned row shows the pinned style and data-pinned; unpinned rows show neither', () => {
    const folded = [
      { path: 'a.md', title: 'a', kind: 'page' as const, content: '' },
      { path: 'b.md', title: 'b', kind: 'page' as const, content: '' },
    ]
    renderRows(folded, ['a.md'])
    const a = screen.getByRole('button', { name: 'a' })
    const b = screen.getByRole('button', { name: 'b' })
    expect(a.getAttribute('data-pinned')).toBe('true')
    expect(a.className).toContain('rowPinned')
    expect(a.querySelector('svg')).toBeNull() // no icon on the row
    expect(b.getAttribute('data-pinned')).toBeNull()
    expect(b.className).not.toContain('rowPinned')
  })

  it('a page row is a single navigable button — no star control on the row', () => {
    renderRows([page], ['notes.md'])
    expect(screen.queryByRole('button', { name: /pin notes/i })).toBeNull()
    const row = screen.getByRole('button', { name: 'notes' })
    expect(row.getAttribute('data-pinned')).toBe('true')
    expect(within(row).queryByRole('button')).toBeNull()
    expect(row.querySelector('svg')).toBeNull()
  })

  it('clicking the row navigates', () => {
    const onSelect = vi.fn()
    renderRows([page], [], onSelect)
    fireEvent.click(screen.getByRole('button', { name: 'notes' }))
    expect(onSelect).toHaveBeenCalledWith('notes.md')
  })

  it('renders rows in the given order, marking only the pinned ones', () => {
    const folded = [
      { path: 'a.md', title: 'a', kind: 'page' as const, content: '' },
      { path: 'b.md', title: 'b', kind: 'page' as const, content: '' },
    ]
    renderRows(folded, ['a.md'])
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

  const renderMixed = (
    pages: Page[],
    assets: string[],
    onOpenAsset = vi.fn(),
    onSelect = vi.fn(),
  ) =>
    render(
      <Sidebar
        pages={pages}
        journalEntries={[]}
        assets={assets}
        onOpenAsset={onOpenAsset}
        activePath={null}
        onSelect={onSelect}
        hasVault
      />,
    )

  it('carries the file path an asset row names, not its label', () => {
    renderMixed([], ['assets/2026/q3-report.pdf'])
    const dt = dragTransfer()
    fireEvent.dragStart(section('Assets').getByRole('button', { name: '2026/q3-report.pdf' }), {
      dataTransfer: dt,
    })
    expect(dt.getData('application/x-folio-asset')).toBe('assets/2026/q3-report.pdf')
    expect(dt.effectAllowed).toBe('copy')
  })

  it('carries the page name a page row names', () => {
    renderMixed([{ path: 'reading list.md', title: 'reading list', kind: 'page', content: '' }], [])
    const dt = dragTransfer()
    fireEvent.dragStart(section('Pages').getByRole('button', { name: 'reading list' }), {
      dataTransfer: dt,
    })
    expect(dt.getData('application/x-folio-page')).toBe('reading list')
  })

  // The same predicate that keeps such a name out of the completion pool: a
  // token would read back as a different page, which is a silent wrong answer.
  it('is not a drag source when no reference token can express the name', () => {
    renderMixed([{ path: 'weird]name.md', title: 'weird]name', kind: 'page', content: '' }], [])
    const row = section('Pages').getByRole('button', { name: 'weird]name' })
    const dt = dragTransfer()
    fireEvent.dragStart(row, { dataTransfer: dt })
    expect(dt.types).toEqual([])
    expect(row.getAttribute('draggable')).toBe('false')
  })

  it('leaves the click alone: a row that does not move still opens', () => {
    const onOpenAsset = vi.fn()
    const onSelect = vi.fn()
    renderMixed(
      [{ path: 'notes.md', title: 'notes', kind: 'page', content: '' }],
      ['assets/shot.png'],
      onOpenAsset,
      onSelect,
    )
    fireEvent.click(section('Assets').getByRole('button', { name: 'shot.png' }))
    fireEvent.click(section('Pages').getByRole('button', { name: 'notes' }))
    expect(onOpenAsset).toHaveBeenCalledWith('assets/shot.png')
    expect(onSelect).toHaveBeenCalledWith('notes.md')
  })
})

describe('Sidebar boards (add-whiteboards)', () => {
  it('lists boards under a Boards section and opens one on click', () => {
    const onOpenBoard = vi.fn()
    render(
      <Sidebar
        pages={[page]}
        journalEntries={[journal]}
        assets={[]}
        boards={['boards/2026/q3.excalidraw', 'boards/Migration.excalidraw']}
        onOpenAsset={() => {}}
        onOpenBoard={onOpenBoard}
        activePath={null}
        onSelect={() => {}}
        hasVault
      />,
    )
    const boards = section('Boards')
    const rows = boards.getAllByRole('button').map((b) => b.textContent)
    expect(rows).toEqual(['2026/q3.excalidraw', 'Migration.excalidraw'])
    fireEvent.click(boards.getByRole('button', { name: 'Migration.excalidraw' }))
    expect(onOpenBoard).toHaveBeenCalledWith('boards/Migration.excalidraw')
  })

  it('marks the open board as the active row', () => {
    render(
      <Sidebar
        pages={[page]}
        journalEntries={[journal]}
        assets={[]}
        boards={['boards/Migration.excalidraw']}
        onOpenAsset={() => {}}
        onOpenBoard={() => {}}
        activePath="boards/Migration.excalidraw"
        onSelect={() => {}}
        hasVault
      />,
    )
    const row = section('Boards').getByRole('button', { name: 'Migration.excalidraw' })
    expect(row.getAttribute('aria-current')).toBe('page')
  })

  it('shows empty-state copy when the vault holds no boards', () => {
    render(
      <Sidebar
        pages={[page]}
        journalEntries={[journal]}
        assets={[]}
        boards={[]}
        onOpenAsset={() => {}}
        onOpenBoard={() => {}}
        activePath={null}
        onSelect={() => {}}
        hasVault
      />,
    )
    expect(section('Boards').getByText('No boards yet.')).toBeTruthy()
  })
})
