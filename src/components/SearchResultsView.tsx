import { useEffect, useMemo, useRef, useState } from 'react'
import type { SearchResult } from '../search/core'
import { MatchBody } from './MatchBody'
import { listKeyDown } from './listNav'
import styles from './SearchResultsView.module.css'

/** Match-list page size (search-results-view): bounded DOM per page instead
 *  of virtualization; short match sets get a single page and no pager. */
export const RESULTS_PER_PAGE = 50

// The full, uncapped match list in the main pane (search-results-view):
// Pages then Journal groups with sticky headers, match snippets, and a
// numbered pager. Transient UI — opening, paging, and closing never touch
// the vault; App owns the query and supplies the results.
export function SearchResultsView({
  query,
  results,
  onOpen,
  onOpenAsset,
  onOpenBoard,
  onClose,
}: {
  query: string
  results: SearchResult[]
  onOpen: (path: string) => void
  /** Activating an asset result: open the file and stay on the results
   *  (search-assets-by-name, design D3) — nothing navigated, so there is no
   *  page to return to and closing would strand the query. */
  onOpenAsset: (path: string) => void
  /** Activating a board result: open the board in the main pane; it navigates,
   *  so the view closes like a page result (add-whiteboards). */
  onOpenBoard?: (path: string) => void
  /** Escape or the Back affordance: return to the previously open page. */
  onClose: () => void
}) {
  const [page, setPage] = useState(0)
  const [active, setActive] = useState(-1)
  const rootRef = useRef<HTMLElement>(null)

  // Focus the pane on open so the keyboard controls it immediately (the
  // see-all click unmounts the button that held focus).
  useEffect(() => {
    rootRef.current?.focus()
  }, [])

  // Pages, then journal days, then boards, then assets, each keeping its
  // relevance order (spec: same grouping as the dropdown, no cap).
  const flat = useMemo(
    () => [
      ...results
        .filter((r) => r.kind === 'page')
        .map((item) => ({ item, group: 'pages' as const })),
      ...results
        .filter((r) => r.kind === 'journal')
        .map((item) => ({ item, group: 'journal' as const })),
      ...results
        .filter((r) => r.kind === 'board')
        .map((item) => ({ item, group: 'boards' as const })),
      ...results
        .filter((r) => r.kind === 'asset')
        .map((item) => ({ item, group: 'assets' as const })),
    ],
    [results],
  )
  const total = flat.length
  const pageCount = Math.max(1, Math.ceil(total / RESULTS_PER_PAGE))
  const current = Math.min(page, pageCount - 1)
  const from = current * RESULTS_PER_PAGE
  const slice = flat.slice(from, from + RESULTS_PER_PAGE)
  // A group header renders where a group begins on the current page; the
  // headers stick to the pane's top while rows scroll under them.
  const rows = slice.map((entry, i) => ({
    ...entry,
    header: i === 0 || slice[i - 1].group !== entry.group,
  }))

  // A file opens in place and leaves the view open; a note navigates and so
  // leaves it (App's open handler sets the pane back to the page).
  const activate = (result: SearchResult) => {
    if (result.kind === 'asset') onOpenAsset(result.path)
    else if (result.kind === 'board') onOpenBoard?.(result.path)
    else onOpen(result.path)
  }

  const onKeyDown = listKeyDown({
    length: slice.length,
    active,
    setActive,
    onEnter: (index) => activate(slice[index].item),
    onEscape: onClose,
  })

  return (
    <main
      ref={rootRef}
      tabIndex={-1}
      aria-label="Search results"
      className={styles.pane}
      onKeyDown={onKeyDown}
    >
      <div className={styles.summary}>
        <span className={styles.query}>{query.trim()}</span>
        <span className={styles.counts}>
          {`${total} ${total === 1 ? 'match' : 'matches'}`}
          {pageCount > 1
            ? ` \u00B7 showing ${from + 1}\u2013${Math.min(from + RESULTS_PER_PAGE, total)}`
            : ''}
        </span>
        <button type="button" className={`btn-secondary ${styles.back}`} onClick={onClose}>
          Back to notes
        </button>
      </div>
      {rows.map(({ item, group, header }, i) => (
        <div key={item.path}>
          {header && (
            <div className={styles.groupHead}>
              {group === 'pages'
                ? 'Pages'
                : group === 'journal'
                  ? 'Journal'
                  : group === 'boards'
                    ? 'Boards'
                    : 'Assets'}
            </div>
          )}
          <button
            type="button"
            className={`${styles.row}${i === active ? ` ${styles.active}` : ''}`}
            onClick={() => activate(item)}
            onMouseEnter={() => setActive(i)}
          >
            <MatchBody result={item} />
          </button>
        </div>
      ))}
      {pageCount > 1 && (
        <div className={styles.pager}>
          <button
            type="button"
            className={styles.pageBtn}
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
          >
            {'\u2039'} Prev
          </button>
          {Array.from({ length: pageCount }, (_, n) => (
            <button
              key={n}
              type="button"
              className={`${styles.pageBtn}${n === current ? ` ${styles.current}` : ''}`}
              aria-current={n === current ? 'page' : undefined}
              onClick={() => setPage(n)}
            >
              {n + 1}
            </button>
          ))}
          <button
            type="button"
            className={styles.pageBtn}
            disabled={current === pageCount - 1}
            onClick={() => setPage(current + 1)}
          >
            Next {'\u203A'}
          </button>
        </div>
      )}
    </main>
  )
}
