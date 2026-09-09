import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { RESULTS_PER_PAGE, SearchResultsView } from './SearchResultsView'
import styles from './SearchResultsView.module.css'
import type { SearchResult } from '../search/core'

// The results view is prop-driven (components never import the vault): the
// full match set arrives via props, opening reports through onOpen, Escape
// through onClose. Everything is exercised without the index (design 4.x:
// transient pane content, no vault interaction).

const result = (path: string, over: Partial<SearchResult> = {}): SearchResult => ({
  path,
  title: path.replace(/\.md$/, '').split('/').pop()!,
  kind: 'page',
  score: 0,
  ranges: [],
  text: '',
  ...over,
})

const page = (n: number): SearchResult =>
  result(`p${n}.md`, { text: 'docker body', ranges: [[0, 6]] })

const renderView = (props: Partial<Parameters<typeof SearchResultsView>[0]> = {}) =>
  render(
    <SearchResultsView
      query="docker"
      results={[page(0)]}
      onOpen={() => {}}
      onClose={() => {}}
      {...props}
    />,
  )

const main = () => screen.getByRole('main')
const rows = () => main().querySelectorAll(`button.${styles.row}`)

describe('SearchResultsView listing (search-results-view spec: full set, groups)', () => {
  it('lists every match uncapped, Pages before Journal, with snippets', () => {
    const results: SearchResult[] = [
      result('docker.md', { text: 'we run docker daily', ranges: [[7, 13]] }),
      result('notes.md', { text: 'plain body' }),
      ...Array.from({ length: 21 }, (_, i) => page(i)),
      result('journals/2026-09-02.md', { kind: 'journal', text: 'docker notes', ranges: [[0, 6]] }),
    ]
    renderView({ results })
    // 23 pages (beyond the dropdown cap of 20) + 1 journal: all listed.
    expect(rows()).toHaveLength(24)
    expect(within(main()).getByRole('button', { name: /^p19/ })).toBeTruthy()
    expect(within(main()).getByText('September 2, 2026')).toBeTruthy()
    // Group headers appear in order: Pages then Journal.
    const heads = within(main()).getAllByText(/^(Pages|Journal)$/)
    expect(heads.map((h) => h.textContent)).toEqual(['Pages', 'Journal'])
    // Snippets highlight the matched span.
    expect(main().querySelectorAll(`mark.${styles.hit}`).length).toBeGreaterThan(0)
  })

  it('shows the query and match count in the summary', () => {
    renderView({ results: [page(0)] })
    // The query appears in the summary and again inside the snippet mark.
    expect(within(main()).getAllByText('docker').length).toBeGreaterThan(0)
    expect(within(main()).getByText('1 match')).toBeTruthy()
  })

  it('renders an empty state if handed no results (defensive)', () => {
    renderView({ results: [] })
    expect(within(main()).getByText('No matches for \u201Cdocker\u201D.')).toBeTruthy()
  })
})

describe('SearchResultsView pagination (search-results-view spec: paginated list)', () => {
  const many = (n: number): SearchResult[] => Array.from({ length: n }, (_, i) => page(i))

  it('pages at RESULTS_PER_PAGE with a range line and numbered pager', () => {
    renderView({ results: many(120) })
    // 120 matches over a 50/page pager: 3 pages, first page full.
    expect(rows()).toHaveLength(RESULTS_PER_PAGE)
    expect(within(main()).getByText(/120 matches/)).toBeTruthy()
    expect(within(main()).getByText(/showing 1\u201350/)).toBeTruthy()
    const prev = within(main()).getByRole('button', { name: /Prev/ })
    expect((prev as HTMLButtonElement).disabled).toBe(true)
    expect(within(main()).getByRole('button', { name: /Next/ })).toBeTruthy()
  })

  it('advances pages with Next, numbered chips, and Prev', () => {
    renderView({ results: many(120) })
    fireEvent.click(within(main()).getByRole('button', { name: /Next/ }))
    expect(rows()).toHaveLength(RESULTS_PER_PAGE)
    expect(within(main()).getByText(/showing 51\u2013100/)).toBeTruthy()
    fireEvent.click(within(main()).getByRole('button', { name: '3' }))
    expect(rows()).toHaveLength(20)
    expect(within(main()).getByText(/showing 101\u2013120/)).toBeTruthy()
    fireEvent.click(within(main()).getByRole('button', { name: /Prev/ }))
    expect(within(main()).getByText(/showing 51\u2013100/)).toBeTruthy()
  })

  it('hides the pager when the set fits one page', () => {
    renderView({ results: many(20) })
    expect(within(main()).queryByRole('button', { name: /Next/ })).toBeNull()
    expect(within(main()).queryByText(/showing/)).toBeNull()
  })
})

describe('SearchResultsView interaction (search-results-view spec: keyboard)', () => {
  it('clicking a result reports its path', () => {
    const onOpen = vi.fn()
    renderView({
      results: [
        page(0),
        result('journals/2026-09-02.md', { kind: 'journal', text: 'docker', ranges: [[0, 6]] }),
      ],
      onOpen,
    })
    fireEvent.click(within(main()).getByRole('button', { name: /^p0/ }))
    expect(onOpen).toHaveBeenCalledWith('p0.md')
    fireEvent.click(within(main()).getByRole('button', { name: /September 2, 2026/ }))
    expect(onOpen).toHaveBeenCalledWith('journals/2026-09-02.md')
  })

  it('arrows move the active row; Enter opens it', () => {
    const onOpen = vi.fn()
    renderView({ results: [page(0), page(1), page(2)], onOpen })
    fireEvent.keyDown(main(), { key: 'ArrowDown' })
    expect(rows()[0].classList.contains(styles.active)).toBe(true)
    fireEvent.keyDown(main(), { key: 'ArrowDown' })
    expect(rows()[1].classList.contains(styles.active)).toBe(true)
    fireEvent.keyDown(main(), { key: 'ArrowUp' })
    expect(rows()[0].classList.contains(styles.active)).toBe(true)
    fireEvent.keyDown(main(), { key: 'Enter' })
    expect(onOpen).toHaveBeenCalledWith('p0.md')
  })

  it('hovering a row moves the active row to it', () => {
    renderView({ results: [page(0), page(1)] })
    fireEvent.mouseEnter(rows()[1])
    expect(rows()[1].classList.contains(styles.active)).toBe(true)
  })

  it('Escape closes back through onClose', () => {
    const onClose = vi.fn()
    renderView({ onClose })
    fireEvent.keyDown(main(), { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('Back to notes closes through onClose', () => {
    const onClose = vi.fn()
    renderView({ onClose })
    fireEvent.click(screen.getByRole('button', { name: 'Back to notes' }))
    expect(onClose).toHaveBeenCalled()
  })
})
